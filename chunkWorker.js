const fs = require('fs');
const mmap = require('@riaskov/mmap-io');
const { parentPort, workerData } = require('worker_threads');
const os = require('os');
const ZeroCopyBuffer = require('./zcbuf');
const { filePath, startPos, length, isLastChunk } = workerData;

let fd;
try {
    if (length <= 0) {
	throw new Error(`Invalid length: ${length}`);
    }
    
    fd = fs.openSync(filePath, 'r');

    // this is absolutely necessary
    const PAGE_SIZE = (() => {
	if (os.platform() === 'win32') {
	    // win typically uses 4KB pages
	    return 4096;
	} else {
	    const cpus = os.cpus();
	    if (cpus.length > 0 && cpus[0].times && cpus[0].times.idle !== undefined) {
		// most modern systems use 4KB pages
		return 4096; 
	    } else {
		// can't determine page size. defaulting to 4KB pages
		return 4096;
	    }
	}
    })();
    
    // align start position to page boundary
    const startPos_aligned = Math.floor(startPos / PAGE_SIZE) * PAGE_SIZE;
    const dataOffset = startPos - startPos_aligned;
    const adjustedLength = length + dataOffset;

    // memory map the chunk
    const buffer = mmap.map(
	adjustedLength,
	mmap.PROT_READ,
	mmap.MAP_SHARED,
	fd,
	startPos_aligned
    );
    
    // extract, convert, process
    const dataBuffer = new ZeroCopyBuffer(buffer, dataOffset, length);
    const chunkData = dataBuffer.toString('utf8');

    let chunkJson = {};
    let jsonString = `{${chunkData}}`;    
    if (!isLastChunk) {
	// remove the last incomplete entry if it's not the last chunk
	jsonString = jsonString.replace(/,\s*[^,]*$/, '}');
    }
    
    try {
	chunkJson = JSON.parse(jsonString);
    } catch (parseError) {	
	// regex fallback to extract as much valid data as possible
	const regex = /"(\d+)":\s*(true|false)/g; 	
	let match;
	while ((match = regex.exec(chunkData)) !== null) {
	    chunkJson[match[1]] = match[2] === 'true';
	}
    }

    // dont worry. mmap-io auto unmaps r.e. the documentation
    fs.closeSync(fd);
    
    if (Object.keys(chunkJson).length > 0) {
	parentPort.postMessage({ success: true, data: chunkJson });
    } else {
	parentPort.postMessage({ success: false, error: 'No valid data parsed', partialData: chunkData });
    }
} catch (err) {
    console.error('Worker error:', err);
    if (fd !== undefined) {
	fs.closeSync(fd);
    }
    parentPort.postMessage({ success: false, error: err.message });
}
