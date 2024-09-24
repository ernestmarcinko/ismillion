const fs = require('fs');
const readline = require('readline');

module.exports = async function generateIndex(FILE_PATH, INDEX_PATH, CHUNK_BYTE_SIZE) {
    const index = [];
    let currentPos = 0;
    let chunkStartPos = 0;
    let chunkStartNum = null;
    let cumulativeByteSize = 0;
    let lastNum = null;
    
    const fileStream = fs.createReadStream(FILE_PATH, { encoding: 'utf8' });
    const rl = readline.createInterface({
	input: fileStream,
	crlfDelay: Infinity,
    });
    
    for await (const line of rl) {
	const lineByteSize = Buffer.byteLength(line + '\n', 'utf8');
	currentPos += lineByteSize;
	cumulativeByteSize += lineByteSize;
	
	const match = line.match(/^\s+"(\d+)":/);
	if (match) {
	    const number = parseInt(match[1], 10);
	    lastNum = number;
	    
	    if (chunkStartNum === null) {
		chunkStartNum = number;
		chunkStartPos = currentPos - lineByteSize;
	    }
	    
	    if (cumulativeByteSize >= CHUNK_BYTE_SIZE) {
		index.push({
		    startNum: chunkStartNum,
		    endNum: number,
		    startPos: chunkStartPos,
		    endPos: currentPos,
		});
		
		// reset for the next chunk
		chunkStartNum = null;
		chunkStartPos = currentPos;
		cumulativeByteSize = 0;
	    }
	}
    }
    
    // add the last chunk if it wasn't alreday
    if (chunkStartNum !== null) {
	index.push({
	    startNum: chunkStartNum,
	    endNum: lastNum,
	    startPos: chunkStartPos,
	    endPos: currentPos,
	});
    }
    
    fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
};
