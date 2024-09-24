class ZeroCopyBuffer {
    constructor(buffer, offset, length) {
	this.buffer = buffer;
	this.offset = offset;
	this.length = length;
    }
    
    toString(encoding = 'utf8') {
	return this.buffer.toString(encoding, this.offset, this.offset + this.length);
    }
    
    slice(start, end) {
	start = (start === undefined) ? 0 : start;
	end = (end === undefined) ? this.length : end;
	return new ZeroCopyBuffer(this.buffer, this.offset + start, end - start);
    }
}

module.exports = ZeroCopyBuffer;
