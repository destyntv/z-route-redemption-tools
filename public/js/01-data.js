// ========== DATA ==========
const HEROES = [
  // Hero database (Oct 2026 meta)
  {name:"Arnold", faction:"Warrior", role:"Tank", rarity:"UR", power:1168137, level:105, stars:5},
  {name:"Monroe", faction:"Warrior", role:"DPS", rarity:"UR", power:517793, level:100, stars:4},
  {name:"Carter", faction:"Warrior", role:"Support", rarity:"UR", power:666705, level:103, stars:4},
  {name:"Bekka", faction:"Tactical", role:"Tank", rarity:"UR", power:845027, level:105, stars:5},
  {name:"Leah", faction:"Tactical", role:"DPS", rarity:"UR", power:497158, level:100, stars:4},
  {name:"Victor", faction:"Assault", role:"DPS", rarity:"UR", power:480051, level:100, stars:4},
  {name:"Yana", faction:"Assault", role:"DPS", rarity:"UR", power:479051, level:100, stars:3},
  {name:"Nora", faction:"Warrior", role:"DPS", rarity:"SSR", power:682236, level:100, stars:5},
  {name:"Toxina", faction:"Warrior", role:"Tank", rarity:"SSR", power:583468, level:100, stars:4},
  {name:"Aria", faction:"Warrior", role:"DPS", rarity:"SSR", power:616351, level:100, stars:4},
  {name:"Zara", faction:"Warrior", role:"Tank", rarity:"SSR", power:508405, level:80, stars:3},
  {name:"Rachel", faction:"Warrior", role:"DPS", rarity:"SSR", power:369792, level:82, stars:3},
  {name:"Celeste", faction:"Assault", role:"DPS", rarity:"SSR", power:377224, level:79, stars:2},
  {name:"Jack", faction:"Assault", role:"Tank", rarity:"SSR", power:410263, level:86, stars:3},
  {name:"Logan", faction:"Warrior", role:"DPS", rarity:"SSR", power:341857, level:80, stars:2},
  {name:"Lee Yu", faction:"Assault", role:"DPS", rarity:"SSR", power:341650, level:82, stars:2},
  {name:"Conan", faction:"Warrior", role:"Tank", rarity:"SSR", power:283882, level:57, stars:1},
  // Additional heroes
  {name:"Dirk", faction:"Warrior", role:"Tank", rarity:"UR", power:1216063, level:150, stars:5},
  {name:"Lucian", faction:"Warrior", role:"DPS", rarity:"UR", power:1074027, level:150, stars:5},
  {name:"Vince", faction:"Assault", role:"Tank", rarity:"UR", power:1192032, level:150, stars:5},
  {name:"Silas", faction:"Tactical", role:"DPS", rarity:"UR", power:1071830, level:150, stars:5},
  {name:"Hank", faction:"Warrior", role:"Tank", rarity:"SR", power:307494, level:56, stars:1},
  {name:"Jackson", faction:"Tactical", role:"DPS", rarity:"SR", power:274344, level:43, stars:1},
  {name:"Jamal", faction:"Warrior", role:"DPS", rarity:"SR", power:324703, level:59, stars:1}
];

const TROOP_TIERS = [
  {id:"T1", color:"#7f8c8d", label:"T1 Basic"},
  {id:"T2", color:"#27ae60", label:"T2"},
  {id:"T3", color:"#2980b9", label:"T3"},
  {id:"T4", color:"#8e44ad", label:"T4"},
  {id:"T5", color:"#8e44ad", label:"T5"},
  {id:"T6", color:"#8e44ad", label:"T6"},
  {id:"T7", color:"#c0392b", label:"T7"},
  {id:"T8", color:"#c0392b", label:"T8"},
  {id:"T9", color:"#f39c12", label:"T9"},
  {id:"T10", color:"#f1c40f", label:"T10 Elite"}
];

let roster = [];
let battles = JSON.parse(localStorage.getItem('zr_battles') || '[]');
