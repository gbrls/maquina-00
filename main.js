const state_0 = {
    value: 0,
    pos: 0,
    memory: new Array(32).fill(0),
    fetch: 0,
    halt: false,
}

let cur_state = state_0;

const instructions = {
    load: state => {
        return { value: state.memory[state.pos], fetch: state.fetch + 1 };
    },

    store: state => {
        let nmem = [...state.memory];
        nmem[state.pos] = state.value;

        return { memory: nmem, fetch: state.fetch + 1 };
    },

    movl: (state, code) => {
        return { pos: state.pos - 1, fetch: state.fetch + 1 };
    },

    movr: (state, code) => {
        return { pos: state.pos + 1, fetch: state.fetch + 1 };
    },

    inc: (state, code) => {
        return { value: state.value + arg(state, code, 0), fetch: state.fetch + 2 };
    },

    dec: (state, code) => {
        return { value: state.value - arg(state, code, 0), fetch: state.fetch + 2 };
    },

    halt: _state => {
        return {halt: true};
    },

    jfz: (state, code) => {
        if (state.memory[state.pos] == 0) {
            return { fetch: find_matching(code, state.fetch) };
        } else {
            return { fetch: state.fetch + 1 };
        }
    },

    jbnz: (state, code) => {
        if (state.memory[state.pos] != 0) {
            return { fetch: find_matching(code, state.fetch) };
        } else {
            return { fetch: state.fetch + 1 };
        }
    },
}

function arg(state, code, i) {
    return code[state.fetch + 1 + i];
}

function find_matching(code, _i) {
    let n = 1;
    let i = _i;
    console.log(code[_i]);
    if (code[_i] == 'jfz') {

        i = _i + 1;

        while(n != 0) {
            if (code[i] == 'jfz') {
                n += 1;
            } else if (code[i] == 'jbnz') {
                n -= 1;
            }

            i += 1;
        }
    } else if (code[_i] == 'jbnz') {

        i = _i - 1;

        while(n != 0) {
            if (code[i] == 'jfz') {
                n -= 1;
            } else if (code[i] == 'jbnz') {
                n += 1;
            }

            i -= 1;
        }

        return i + 2;
    }
    
    return i;
}

function instr_display(x) {
    const tbl = {
        inc: '+',
        dec: '-',
        movr: '>',
        movl: '<',
        jfz: '[',
        jbnz: ']',
    };


    if (tbl.hasOwnProperty(x)) {
        return tbl[x];
    } else {
        return x;
    }
}

function next_state(state, change) {
    let nstate = { ...state };

    for (const p in change) {
        nstate[p] = change[p];
    }

    return nstate;
}

function execute(state, i, code) {
    if (instructions.hasOwnProperty(i)) {

        return next_state(state, instructions[i](state, code));

    } else {
        console.log('Unkown instruction', i);
    }
}

function run(state, program) {
    return program.reduce((state, i) => execute(state, i, program), state);
}

function* gen_run(state, program) {
    let cur = state;
    while(!cur.halt) {
        cur = execute(cur, program[cur.fetch], program);
        yield cur;
    }
}

function render_memory(state) {
    const base = document.getElementById('memory');


    if ((base.childNodes.length - 1) != state_0.memory.length) {
        //console.log('building');
        for (const val in state.memory) {
            const node = document.createElement('div');
            node.textContent = state.memory[val];
            node.className = 'memcell';
            base.appendChild(node);
        }
    } else {

        [...base.childNodes]
            .map(({ nodeType, textContent, nodeValue }, html_i) => { 
                if (html_i > 0) {
                    const i = html_i - 1;
                    const node = base.childNodes[html_i];
                    node.textContent = state.memory[i]; 

                    if (state.pos == i) {
                        node.style.color = 'yellow';
                    } else {
                        node.style.color = 'white';
                    }

                }
                { html_i, nodeType, textContent, nodeValue } 
            })

    }
}

function render_code(code, state) {
    const base = document.getElementById('code');
    //base.textContent = code.join(' ');

    if ((base.childNodes.length - 1) != code.length) {
        for (const i in code) {
            const node = document.createElement('div');
            node.textContent = instr_display(code[i]);
            node.className = 'codecell';
            base.appendChild(node);
        }
    } else {

        [...base.childNodes]
            .map(({ nodeType, textContent, nodeValue }, html_i) => { 
                if (html_i > 0) {
                    const i = html_i - 1;
                    const node = base.childNodes[html_i];

                    if (state.fetch == i) {
                        node.style.color = 'yellow';
                    } else {
                        node.style.color = 'white';
                    }
                }
            })
    }
}

window.onload = () => {

    //const code = ['inc', 20, 'store', 'inc', 10, 'movr', 'store', 'jfz', 'dec', 1, 'store', 'jbnz','movr' ,'halt'];
    const code = [
        'inc', 1, 'movr', 'store', 'movr', 'store',
        'jfz',
            'movl', 'load', 'movl', 'store', 'movr', 'movr', 'load', 'movl', 'store', 'movl',
        'jfz',
                'movr', 'load', 'inc', 1, 'store', 'movl', 'load', 'dec', 1, 'store', 
        'jbnz', 
        'movr', 'movr','load','movl','movl','store','movr','load','movr','store','movl','movl','load','movr','store','movr',
        'jbnz',
        'halt'
    ];

    //const code = ['inc', 'inc', 'inc', 'store', 'movr', 'store'];

    const gen = gen_run(state_0, code);
    let n = gen.next();

    render_code(code);
    render_memory(n.value);

    setInterval(() => {
        n = gen.next();
        if (!n.done) {
            render_memory(n.value);
            render_code(code, n.value);
        } else {
            console.log('done');
        }
    }, 200);

}
