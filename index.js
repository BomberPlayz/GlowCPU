var ram = new Int16Array(2048);
/*
ram[0] = 0x1001
ram[1] = 0x1001
ram[2] = 0x1001
ram[3] = 0x5503
ram[4] = 0x1121
*/
class CPU {
  constructor(ram,instrlist) {
    this.RAM = ram
    this.PC = 0x0
    this.SP = 0x0
    this.stack = new Int16Array(32)


    this.registers = new Int16Array(15)
    this.instructList = instrlist
   // this.debug = true

  }
  step() {
    //console.log(this.decode(this.fetch()));
    let dec = this.decode(this.fetch())
    if (typeof dec != "undefined") {
      let args = dec[1]
      //console.log(dec);
      //console.log("PC :: "+this.PC);
      switch (dec[0].id) {
        case "ADD":
          if (this.debug) {
            console.log("ADD ACC ["+this.registers[0]+"] -> "+args[0]+" = "+(Number(this.registers[0])+Number(args[0])));
          }

          this.registers[0] = this.registers[0]+args[0]
          this.PC++

          break;
        case "MOV":
          this.registers[args[1]] = this.registers[args[0]]
          if (this.debug) {
            console.log("MOV "+args[0]+" ["+this.registers[args[0]]+"] -> "+args[1]+" ["+this.registers[args[1]]+"]");
          }

          this.PC++
          break
        case "LD":
          
          this.registers[args[1]] = args[0]
          if (this.debug) {
            console.log("LD "+args[0]+" -> "+args[1]+" ["+this.registers[args[1]]+"]");
          }

          this.PC++
          break
        case "JMP":
          let opc = this.PC
          this.PC = this.registers[args[0]]
          if (this.debug) {
            console.log("JMP "+opc+" -> "+this.PC+" (reg "+args[0]+")");
          }
          break
        case "SRG":
          if (this.debug) {
            console.log("SRG "+args[0]+" ["+this.registers[args[0]]+"] -> "+this.registers[0]);
          }
          this.registers[args[0]] = this.registers[0]
          this.PC++
          break;
        case "STR":
          if (this.debug) {
            console.log("STR "+this.registers[0]+" -> "+this.registers[7]+" [IR :: "+this.RAM[this.registers[7]]+"]");
          }
          this.RAM[this.registers[7]] = this.registers[0]
          this.PC++
          break
        case "RCU":
          if (this.debug) {
            console.log("RCU "+this.registers[args[0]]);
          }
          if(this.SP > this.stack.length) {
            throw "Stack overflow"
          }
          this.stack[this.SP+1] = this.PC
          this.SP++
          this.PC = this.registers[args[0]]
          break
        case "INT":
          if (this.debug) {
            console.log("INT "+args[0]);
          }
          if (args[0] == 0x01) {
            process.stdout.write(String.fromCharCode(this.registers[8]))
          } else {

          }

          this.PC++
          break;
        case "JEZ":
          let opa = this.PC
          if (this.registers[0] == 0) {
            this.PC = this.registers[args[0]]
          }

          if (this.debug) {
            console.log("JNZ "+opa+" -> "+this.PC+" (reg "+args[0]+")"+" :: "+this.registers[0] == 0 ? true : false);
          }
          break
        case "JNZ":
          let opr = this.PC
          if (this.registers[0] != 0) {
            this.PC = this.registers[args[0]]
          }

          if (this.debug) {
            console.log("JNZ "+opr+" -> "+this.PC+" (reg "+args[0]+")"+" :: "+this.registers[0] != 0 ? true : false);
          }
          break
        case "RFC":
          this.PC = this.stack[this.SP - 1]
          this.stack[this.SP] = 0x0
          this.SP = this.SP-1
          break
        default:
          this.PC++
          break
      }
      //console.log("PC: "+this.PC+" :: ACC: "+this.registers[0]+" :: BAK: "+this.registers[1]);
    } else {
      this.PC++
    }
  }
  fetch() {
    return this.RAM[this.PC]
  }
  decode(opcode) {
        const inst = this.instructList.find(
          instr => (opcode & instr.mask) === instr.pattern
        )


        if (inst) {
          const args = inst.args.map(arg => (opcode & arg.mask) >> arg.shift)


          return [ inst, args ]
        } else {
          //console.log("undefined instruction: "+opcode);
        }


  }
}
let cpu = new CPU(ram,[
  { //JMP - jumps to the address in the specified register
    key: 1,
    id: 'JMP',
    name: 'JMP',
    mask: 0xff0f,
    pattern: 0x1101,
    args: [{
      mask: 0x00f0, shift: 4
    }],
  },
  { // ADD - adds a number to ACC
    key: 2,
    id: "ADD",
    name: "ADD",
    mask: 0xf000,
    pattern: 0x1000,
    args: [{
      mask: 0x0fff, shift: 0
    }]
  },
  { // SUB - subtracts a number from ACC
    key: 3,
    id: "SUB",
    name: "SUB",
    mask: 0xf000,
    pattern: 0x2000,
    args: [{
      mask: 0x0fff, shift: 0
    }]
  },
  { // ADR - adds a number to ACC regist
    key: 4,
    id: "ADR",
    name: "ADD_REG",
    mask: 0xff00,
    pattern: 0x1100,
    args: [{
      mask: 0x00ff, shift: 12
    }]
  },
  { // SUR - subtracts a number from ACC regfist
    key: 5,
    id: "SUR",
    name: "SUB_REG",
    mask: 0xff00,
    pattern: 0x2100,
    args: [{
      mask: 0x00ff, shift: 12
    }]
  },
  { // set register to acc
    key: 6,
    id: "SRG",
    name: "SRG",
    mask: 0xff00,
    pattern: 0x5500,
    args: [{
      mask: 0x00ff, shift: 0

    },
  ]
},
{ // move adr to adr
  key: 8,
  id: "MOV",
  name: "MOV",
  mask: 0xff00,
  pattern: 0xf900,
  args: [
    {
      mask: 0x000f, shift: 0
    },
    {
      mask: 0x00f0, shift: 1
    }
  ]
},
{ // move number to adr
  key: 9,
  id: "LD",
  name: "LD",
  mask: 0xf000,
  pattern: 0xa000,
  args: [
    {
      mask: 0x00ff, shift: 0
    },
    {
      mask: 0x0f00, shift: 8
    },


  ]
},
{ // set register to acc
  key: 11,
  id: "INT",
  name: "INT",
  mask: 0xff00,
  pattern: 0xf600,
  args: [{
    mask: 0x00ff, shift: 0

  },
]
},
{ //jump if ACC is zero
  key: 12,
  id: 'JEZ',
  name: 'JEZ',
  mask: 0xff0f,
  pattern: 0x1102,
  args: [{
    mask: 0x00f0, shift: 4
  }],
},
{ //jump if ACC is not zero
  key: 13,
  id: 'JNZ',
  name: 'JNZ',
  mask: 0xff0f,
  pattern: 0x1103,
  args: [{
    mask: 0x00f0, shift: 4
  }],
},
{ // run coroutine at register
  key: 14,
  id: "RCU",
  name: "RCU",
  mask: 0xfff0,
  pattern: 0x3f30,
  args: [
    {
      mask: 0x000f,
      shift: 0
    }
  ]
},
  { // return from coroutine
    key: 15,
    id: "RFC",
    name: "RFC",
    mask: 0xffff,
    pattern: 0x1398,
    args: []
  },
])

function compile(data) {
    let els = false
    let por  = data.replace(/[\n\r]/g, "")

    let fit = []
    let func = {}

    por = por.split(";")
    por.splice(por.length-1,1)
    for(let i=0; i<por.length; i++) {
        let nole = true
        let sip = por[i].split(" ")
        let fns = []
        console.log(sip)

        for(let ii=1; ii<sip.length; ii++) {
            if(sip[ii].startsWith(".")) {
                //nole = false
                let ba0 = 0xf
                let ba1 = typeof func[sip[ii]] != "undefined" ? func[sip[ii]] : ba0
              console.log(ba1)
                sip[ii] = ba1.toString()
            }
        }

        if(sip[0]) {
            if (sip[0].startsWith(".")) {
              func[sip[0]] = sip[1] ? sip[1] : i
              console.log(func[sip[0]])
            }
            for (var ii = 0; ii < cpu.instructList.length; ii++) {
              if (cpu.instructList[ii].id == sip[0].toUpperCase()) {
                fit[i] = cpu.instructList[ii].pattern
                if (sip[1]) {
                  fit[i] = fit[i] | (Number(sip[1]) << cpu.instructList[ii].args[0].shift)
                }
                if (sip[2]) {
                  fit[i] = fit[i] | (Number(sip[2]) << cpu.instructList[ii].args[1].shift)
                }
                break
              }
            }







        }

      console.log(sip)
    }
    console.log("compiled: "+fit.map(function(val) {
      return val.toString(16)
    }))
    let towrite = ""
    for (var i = 0; i < fit.length; i++) {
      towrite = towrite + String.fromCharCode(fit[i])
    }
    require("fs").writeFileSync("./bin.glw", towrite)
    return fit
}

function hll(data) {
  function tokenize ( s, parsers, deftok ) {
  var m, r, l, cnt, t, tokens = [];
  while ( s ) {
    t = null;
    m = s.length;
    for ( var key in parsers ) {
      r = parsers[ key ].exec( s );
      // try to choose the best match if there are several
      // where "best" is the closest to the current starting point
      if ( r && ( r.index < m ) ) {
        t = {
          token: r[ 0 ],
          type: key,
          matches: r.slice( 1 )
        }
        m = r.index;
      }
    }
    if ( m ) {
      // there is text between last token and currently
      // matched token - push that out as default or "unknown"
      tokens.push({
        token : s.substr( 0, m ),
        type  : deftok || 'unknown'
      });
    }
    if ( t ) {
      // push current token onto sequence
      tokens.push( t );
    }
    s = s.substr( m + (t ? t.token.length : 0) );
  }
  return tokens;
}

let toke = tokenize(data,{
  string: /(?<=\")(.*?)(?=\")/
})
}

function prst(str) {
  let ret = ""

  for (let i = 0; i < str.length; i++) {
    ret = ret+`
ld 0 0;
add ${str[i].charCodeAt(0)};
srg 8;
int 0x01;
`
  }

  return ret
}

let comped = compile(hll(`
var asd = 10

if asd == 10:
  charPrint("a")
:end

`))
//let comped = "ꀀ၈唈ꀀၥ唈ꀀၬ唈ꀀၬ唈"
for (var i = 0; i < comped.length; i++) {
  ram[i] = comped[i]
}

while (cpu.PC < 2048) {
  //console.log(cpu.PC);

cpu.step()
}
