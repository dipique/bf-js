'use strict'

document.addEventListener('DOMContentLoaded', () => {
    let bf = null
    const inputEl = document.getElementById('txtInput')

    function inputRequested() {
        console.log('UI received input request')
        if (!inputEl.value) {
            inputEl.classList.add('input-needed')
            inputEl.focus()
            console.log('No available chars, need to wait for user input')
        } else {
            const retVal = inputEl.value[0]
            inputEl.value = inputEl.value.substring(1)
            console.log('Found available chars, sending one now')
            bf.giveData(retVal)
        }
    } 

    let output = ''

    const onOutput = ch => {
        if (!ch) return;
        if (!ch.replace(/\0/g,'')) return
        output += ch;
        updateOutputUI()
    }

    const updateOutputUI = () => {
        document.getElementById('lblResult').innerHTML = 
            output === '' ? 'No Result' : output
        document.getElementById('lblResultHex').innerHTML =
            output === '' ? 'x00' : strToHex(output)
    }

    document.getElementById('btnRemoveUnused').addEventListener('click', function() {
        const programTxt = document.getElementById('txtProgram').value
        const removed = removeUnusedCharacters(programTxt)
        document.getElementById('txtProgram').value = removed
    })
    
    document.getElementById('btnCompile').addEventListener('click', async function() {
        output = ''
        updateOutputUI()
        const programTxt = document.getElementById('txtProgram').value
        if (!bf) bf = new BrainFuck(inputRequested, onOutput)
        bf.start(programTxt)
    })

    inputEl.oninput = function(e) {
        console.log('Got user input', e)
        //is this character needed?
        if (!inputEl.classList.contains('input-needed')) {
            console.log('User input not needed yet.')
            return
        }

        inputEl.classList.remove('input-needed')
        inputEl.value = inputEl.value.substring(1)
        console.log('User input needed: sending now.')
        bf.giveData(e.data)           
    }

    inputEl.onkeypress = function(e) {
        if (inputEl.classList.contains('input-needed') && e.code === 'Enter') {
            inputEl.classList.remove('input-needed')
            bf.giveData(0)
        }
    }
    
    const strToHex = str => Array.from(str)
        .map(ch => Number(ch.charCodeAt(0)))
        .map(code => `x${code.toString(16).padStart(2,'0')}`)
        .join(' ')
})

//add triggers to bf
//outputchange
//finish
//needs input