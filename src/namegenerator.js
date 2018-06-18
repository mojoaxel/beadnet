let names = ["Lester","Margot","Abdul","Avery","Clara","Ewald","Kendall", "Leda","Dawn","Quinn","Dane","Buster","Patience","Carlee","Maud","Jacey","Samara", "Alene","Kaylin","Hubert","Al","Franco","Mervin","Neha","Kole","Candida","Enoch", "Pansy","Ryder","Everett","Mabel","Tavares","Landen","Jocelyn","Bryon", "Dayne","Derek","Kyla","Estevan","Orval","Violette","Daija", "Stella","Zelma","Robyn","Colby","Joyce","Cruz","Pedro","Leanna", "Emanuel","Mozelle","Hans","Randal","Ivy","Marco", "Abbey","Shea","Ethan","Novella","Abel","Kale","Irma","Esther","Ransom","Glennie", "Edmund","Aric","Aiyana","Trenton","Dana","Wade","Tyrell","Timmy","Dudley","Macy", "Marilie","Kaley","Gayle","Eda","Max","Kaitlyn","Josie","Lea","Nico","Marc"];

function getName(options) {
	return names[Math.floor(Math.random()*names.length)];
}

export default getName