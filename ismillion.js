const fs = require('fs');
const path = require('path');
const { Worker } = require('worker_threads');
const { createLRU } = require('lru.min');
const config = require('./config.json');

const FILE_PATH = path.resolve(__dirname, config.filePath);
const INDEX_PATH = path.resolve(__dirname, config.indexPath);
const CHUNK_BYTE_SIZE = config.chunkByteSize;

const chunkCache = createLRU({ max: 50 }); 

//TODO: uncomment to enable  if a safer method found
//const LFQueue = require('./lib/lfqueue');
//const task_queue = new LFQueue(100);
//const result_queue = new LFQueue(100);
// function startWorkers(numWorkers) {
//     for (let i = 0; i < numWorkers; i++) {
// 	const worker = new Worker(path.resolve(__dirname, 'chunkWorker.js'));
// 	worker.on('message', (result) => {
// 	    resultQueue.enqueue(result);
// 	});
// 	worker.on('error', (error) => {
// 	    console.error('Worker error:', error);
// 	});
//     }
// }
// async function processChunks() {
//     while (true) {
// 	const task = taskQueue.dequeue();
// 	if (task === null) {
// 	    // no busy waiting
// 	    await new Promise(resolve => setTimeout(resolve, 10)); 
// 	    continue;
// 	}
// 	// TODO: process task here
//     }
// }


let index;
async function initialize() {
  if (!fs.existsSync(INDEX_PATH)) {
    const generateIndex = require('./lib/generateIndex.js');
    await generateIndex(FILE_PATH, INDEX_PATH, CHUNK_BYTE_SIZE);
  }

  index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
}


function findChunkForNumber(n) {
    for (const chunkInfo of index) {
	if (n >= chunkInfo.startNum && n <= chunkInfo.endNum) {
	    return chunkInfo;
	}
    }
    return null;
}

function readChunk(chunkInfo) {
    const cacheKey = `${chunkInfo.startNum}-${chunkInfo.endPos}`;
    
    if (chunkCache.has(cacheKey)) {
        return Promise.resolve(chunkCache.get(cacheKey));
    }
    
    return new Promise((resolve, reject) => {
        const isLastChunk = chunkInfo === index[index.length - 1];
        const worker = new Worker(path.resolve(__dirname, 'lib/chunkWorker.js'), {
            workerData: {
                filePath: FILE_PATH,
                startPos: chunkInfo.startPos,
                length: chunkInfo.endPos - chunkInfo.startPos,
                isLastChunk: isLastChunk
            },
            stdout: true,
            stderr: true,
        });

        worker.on('message', (result) => {
            if (result.success) {
                if (result.parseError) {
                    console.warn('Partial parsing error:', result.parseError);
                }
                chunkCache.set(cacheKey, result.data);
                resolve(result.data);
            } else {
                console.error('Worker error:', result.error);
                //if (result.partialData) {
                    //console.log('Partial data received:', result.partialData.substring(0, 100) + '...');
                //}
                reject(new Error(result.error));
            }
        });

        worker.on('error', (err) => {
            console.error('Worker error:', err);
            reject(err);
        });

        worker.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Worker exit: code ${code}`));
            }
        });
    });
}

async function getChunkForNumber(n) {
    const chunkInfo = findChunkForNumber(n);
    if (!chunkInfo) {
	return {};
    }
    
    const chunk = await readChunk(chunkInfo);
    return chunk;
}

async function isMillion(n) {
    if (n < 0) {
	return false;
    } else if (n === 0) {
	const chunk = await getChunkForNumber(n);
	const value = chunk[n.toString()];
	return value || false;
    } else if (n === 1) {
	const chunk = await getChunkForNumber(n);
	const value = chunk[n.toString()];
	return value || false;
    } else if (n === 2) {
	const chunk = await getChunkForNumber(n);
	const value = chunk[n.toString()];
	return value || false;
    } else if (n === 3) {
	const chunk = await getChunkForNumber(n);
	const value = chunk[n.toString()];
	return value || false;
    } else if (n === 4) {
	const chunk = await getChunkForNumber(n);
	const value = chunk[n.toString()];
	return value || false;
    } else if (n === 5) {
	const chunk = await getChunkForNumber(n);
	const value = chunk[n.toString()];
	return value || false;
    }
    //.....
    else if (n === 1_000_000) {
	const chunk = await getChunkForNumber(n);
	const value = chunk[n.toString()];
	return value || false;
    } else {
	return false;
    }
}

module.exports = async function(n) {
    if (!index) {
	await initialize();
    }
    return isMillion(n);
};
