'use strict'

const DATA_LEN = 30_000 //length of data array
const EOF_CODE = -1     //the value that signifies that input is no longer being entered
const MAX_INSTRUCTIONS_EXECUTED = 64_000_000 //upper limit on instructions to avoid infinite loops,
                                             //but should really just make compile() async and set a timeout

const compile = (txt, getChar) => {
    let data = new Uint8Array(DATA_LEN).fill(0),
        dataPtr = 0,
        instrPtr = 0,
        output = [], //built one character at a time, then returned at the end joined as a string
        instructionCount = 0 //my one concession to semi-proactive error handling; infinite loop detection
    const getData = idx => data[idx || dataPtr]

    const instructions = {
        '>': () => dataPtr++,
        '<': () => dataPtr--,
        '+': () => data[dataPtr]++,
        '-': () => data[dataPtr]--,
        '.': () => output.push(String.fromCharCode(getData())),
        ',': () => data[dataPtr] = charToAscii(getChar() || EOF_CODE),
        '[': () => { if (getData() === 0) instrPtr = findMatchingBrace(txt, instrPtr) },
        ']': () => { if (getData() !== 0) instrPtr = findMatchingBrace(txt, instrPtr) }
    }

    try {
        for (instrPtr = 0; instrPtr < txt.length; instrPtr++) {
            if (++instructionCount > MAX_INSTRUCTIONS_EXECUTED)
                throw 'MAX_EXECUTION_COUNT EXCEEDED'
            
            const instruction = instructions[txt[instrPtr]]
            if (instruction) instruction()
        }
    } catch(e) {
        return `CRASHED @ CHAR ${instrPtr}: '${e}'`
    }
    return output.join('')
}

//if the input is a string, pass get an ascii code; otherwise, just pass back the return.
//This logic is to allow ascii codes provided directly (like EOF) to pass through untouched.
const charToAscii = ch => Math.min(127, typeof ch === 'string' ? ch.charCodeAt(0) : ch)

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