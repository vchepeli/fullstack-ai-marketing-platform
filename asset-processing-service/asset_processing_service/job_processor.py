

import asyncio
import os
from asset_processing_service.api_client import fetch_asset, fetch_asset_file, update_asset_content, update_job_heartbeat, update_job_details
from asset_processing_service.media_processor import extract_audio_and_split, split_audio_file, transcribe_chunks
from asset_processing_service.models import AssetProcessingJob
from asset_processing_service.config import config
from asset_processing_service.logger import logger



async def process_job(job: AssetProcessingJob) -> None:
    logger.info(f"Processing job {job.id}...")

    heartbeat_task = asyncio.create_task(heeatbeat_updater(job.id))

    try:
        #  Update job status to "in_progress"
        await update_job_details(job.id, {"status": "in_progress"})

        # Fetch assset associated with asset processing job
        asset = await fetch_asset(job.assetId)
        if asset is None:
            raise ValueError(f"Asset with ID {job.assetId} not found")
        
        file_buffer = await fetch_asset_file(asset.fileUrl)

        content_type = asset.fileType
        content = ""

        if content_type in ["text", "markdown"]:
            logger.info(f"Text file detected. Ready content of {asset.fileName}")
            content = file_buffer.decode("utf-8")
        elif content_type == "audio":
            logger.info("Processing audio file...")
            chunks = await split_audio_file(
                file_buffer,
                config.MAX_CHUNK_SIZE_BYTES,
                os.path.basename(asset.fileName),
            )
            transcribed_chunks = await transcribe_chunks(chunks)
            content = "\n\n".join(transcribed_chunks)
        elif content_type == "video":
            logger.info("Processing video file...")
            chunks = await extract_audio_and_split(
                file_buffer,
                config.MAX_CHUNK_SIZE_BYTES,
                os.path.basename(asset.fileName)
            )
            transcribed_chunks = await transcribe_chunks(chunks)
            content = "\n\n".join(transcribed_chunks)
        else:
            raise ValueError(f"Unsupported content type: {content_type}")
        
        logger.info(f"FINAL CONTENT: {content}")

        # update asset content
        await update_asset_content(asset.id, content)

        #  Update job status to completed
        await update_job_details(job.id, {"status": "completed"})

    except Exception as e:
        logger.error(f"Error processing job {job.id}: {e}")
        error_message = str(e)
        await update_job_details(
            job.id,
            {
                "status": "failed",
                "errorMessage": error_message,
                "attempts": job.attempts + 1,
            },
        )

    finally:
        heartbeat_task.cancel()
        try:
            await heartbeat_task
        except asyncio.CancelledError:
            pass


async def heeatbeat_updater(job_id: str):
    while True:
        try:
            await update_job_heartbeat(job_id)
            await asyncio.sleep(config.HEARTBEAT_INTERVAL_SECONDS)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error updating heartbeat for job {job_id}: {e}")
            
