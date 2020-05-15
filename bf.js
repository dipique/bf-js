'use strict'

const DATA_LEN = 30_000 //length of data array
const EOF_CODE = -1     //the value that signifies that input is no longer being entered
const MAX_INSTRUCTIONS_EXECUTED = 1_000_000_000 //upper limit on instructions to avoid infinite loops,
                                                //but should really just make compile() async and set a timeout

const BrainFuck = function(askChar, putChar) {
    const self = this
    this.txt = ''
    let dataPtr = 0
    let instrPtr = 0
    let instructionCount = 0 //the number of instructions that have been executed so far

    const getData  = idx => self.data[idx || dataPtr]
    const getInstr = idx => self.txt [idx || instrPtr]
    const putChars = str => Array.from(str).map(ch => putChar(ch))

    let pendingInput = false
    this.giveData = ch => { 
        console.log(`Got data: ${ch}`)
        self.data[dataPtr] = charToAscii(ch || EOF_CODE) 
        pendingInput = false
        interpreter()
    }

    //This generator is responsible for taking the program text and filtering out irrelevant characters,
    //and also dealing with brackets control flow. It's important that each symbol be accepted and then
    //fully dealt with before another symbol is requested.
    function* symbolStream() {
        while (instrPtr < self.txt.length) {
            switch(getInstr()) {
                case '[':
                    if (getData() === 0) instrPtr = findMatchingBrace(self.txt, instrPtr)
                    break
                case ']':
                    if (getData() !== 0) instrPtr = findMatchingBrace(self.txt, instrPtr)
                    break
                case '<': case '.': case '-':
                case '>': case ',': case '+':
                    yield getInstr()
                default: break
            }
            instrPtr++
            if (instructionCount++ > MAX_INSTRUCTIONS_EXECUTED)
                throw 'MAX_EXECUTION_COUNT EXCEEDED'
        }
    }

    const instructions = {
        '>': () => dataPtr++,
        '<': () => dataPtr--,
        '+': () => self.data[dataPtr]++,
        '-': () => self.data[dataPtr]--,
        '.': () => putChar(String.fromCharCode(Math.max(0, getData()))),
        ',': () => { askChar(); pendingInput = true; console.log('requesting data'); }
    }

    //this generator has no internal state, only external status, so it can be readily stopped and started again
    function interpreter() {
        try {
            while (!self.pendingInput) {
                let nextInstr = self.symStream.next()
                if (!nextInstr || nextInstr.done) return
                let instrCode = nextInstr.value                
                instructions[instrCode]()
                if (pendingInput) return
            }
        } catch(e) {
            putChars(`CRASHED @ CHAR ${instrPtr}: '${e}'`)
        }
    }

    this.start = function(txt) {
        self.data = new Int8Array(DATA_LEN).fill(0)
        self.txt = txt
        self.symStream = symbolStream()
        instrPtr = 0
        dataPtr = 0
        interpreter()
    }
}

//if the input is a string, get an ascii code; otherwise, just pass back the return.
//This logic is to allow ascii codes provided directly (like EOF) to pass through untouched.
const charToAscii = ch => Math.max(-128, Math.min(127, typeof ch === 'string' ? ch.charCodeAt(0) : ch))

const findMatchingBrace = (txt, currentBraceIdx) => {
    const currentBrace = txt[currentBraceIdx]
    const otherBrace = currentBrace === '[' ? ']' : '['
    const stepAmt    = currentBrace === '[' ?  1  : -1

    let currentIdx = currentBraceIdx + stepAmt
    let braceLevel = 0
    while (true) {
        if (txt[currentIdx] === currentBrace)
            braceLevel++
        else if (txt[currentIdx] === otherBrace) {
            if (braceLevel-- === 0)
                return currentIdx
        }            
        currentIdx += stepAmt    
    }    
}

const removeUnusedCharacters = bfTxt => bfTxt.replace(/[^<>,.\[\]+-]/g, '')