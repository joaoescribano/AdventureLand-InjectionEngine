var version = "0.1-Alpha";
var battle_list = [];
var attacking = null;

var injConf = {
    hunt: false,
    drink: false,
    buy: false,
    buy_items: {
        'hpot0': 0,
        'hpot1': 0,
        'mpot0': 0,
        'mpot1': 0
    },
    loot: false,
    party_mode: false,
    party: false,
    allowed_monsters: ['Bee', 'Goo']
};

var huntSession = {
    started: null,
    gold_spent: 0,
    gold_won: 0,
    best_damage: 0,
    total_damage: 0,
    deaths: 0,
    kills: [],
    loot: [],
};

var last_potion = new Date();
var huntTick = null;

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function updateCookie() {
    setCookie("injConf", JSON.stringify(injConf));
}

function toggle_injection() {
    if ($("#injection_engine").length) {
        if ($("#injection_engine").is(":visible")) {
            $("#injection_engine").fadeOut("slow");
        } else {
            $("#injection_engine").fadeIn("slow");
        }
    }
}

function toggle_auto_hunt() {
    injConf.hunt = (injConf.hunt ? false : true);
    if (injConf.hunt) {
        huntTick = setInterval(huntTickFn, 100);
    } else {
        clearInterval(huntTick);
    }
    $("#btn_auto_hunt span").attr("class", (injConf.hunt ? "on" : "off")).html((injConf.hunt ? "on" : "off"));
    window.parent.add_log("Auto Hunt " + (injConf.hunt ? "<span style='color: green;'>enabled</span>" : "<span style='color: red;'>disabled</span>"), "#FFCC00");
    updateCookie();
}

function toggle_auto_drink() {
    injConf.drink = (injConf.drink ? false : true);
    $("#btn_auto_drink span").attr("class", (injConf.drink ? "on" : "off")).html((injConf.drink ? "on" : "off"));
    window.parent.add_log("Auto Drink " + (injConf.drink ? "<span style='color: green;'>enabled</span>" : "<span style='color: red;'>disabled</span>"), "#FFCC00");
    updateCookie();
}

function toggle_auto_buy() {
    injConf.buy = (injConf.buy ? false : true);
    $("#btn_auto_buy span").attr("class", (injConf.buy ? "on" : "off")).html((injConf.buy ? "on" : "off"));
    window.parent.add_log("Auto Buy " + (injConf.buy ? "<span style='color: green;'>enabled</span>" : "<span style='color: red;'>disabled</span>"), "#FFCC00");
    updateCookie();
}

function toggle_auto_loot() {
    injConf.loot = (injConf.loot ? false : true);
    $("#btn_auto_loot span").attr("class", (injConf.loot ? "on" : "off")).html((injConf.loot ? "on" : "off"));
    window.parent.add_log("Auto Loot " + (injConf.loot ? "<span style='color: green;'>enabled</span>" : "<span style='color: red;'>disabled</span>"), "#FFCC00");
    updateCookie();
}

function toggle_party() {
    injConf.party_mode = (injConf.party_mode ? false : true);
    if (injConf.party_mode) {
        startParty();
    } else {
        stopParty();
    }
    $("#btn_party span").attr("class", (injConf.party_mode ? "on" : "off")).html((injConf.party_mode ? "on" : "off"));
    window.parent.add_log("Party Mode " + (injConf.party_mode ? "<span style='color: green;'>enabled</span>" : "<span style='color: red;'>disabled</span>"), "#FFCC00");
}

function startParty() {
    if (injConf.party && injConf.party_mode) {
        var chars = injConf.party.split(",");
        for (var i = 0; i < chars.length; i++) {
            charName = chars[i];
            window.parent.stop_character_runner(charName);
            window.parent.start_character_runner(charName, 0);
        }
    }
}

function stopParty() {
    if (injConf.party) {
        var chars = injConf.party.split(",");
        for (var i = 0; i < chars.length; i++) {
            charName = chars[i];
            window.parent.stop_character_runner(charName);
        }
    }
}
// character_code_eval("Shazan", 'say("Total potion: " + window.top.inventory_item_quantity("hpot0"))')
function distanceToPoint(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

function inventory_item_quantity(name, level = null) {
    var item_count = window.parent.character.items.filter(item => item != null && item.name == name && (level !== null ? item.level == level : true)).reduce(function(a, b) {
        return a + (b["q"] || 1);
    }, 0);
    return parseInt(item_count);
}

function inventory_items(name) {
    for (i in window.parent.character.items) {
        var c_items = window.parent.character.items[i];
        if (c_items && c_items.name == name) {
            return i;
        }
    }
    return null;
}

function find_item(filter) {
    for (let i = 0; i < window.parent.character.items.length; i++) {
        let item = window.parent.character.items[i];
        if (item && filter(item)) return [i, window.parent.character.items[i]];
    }
    return [-1, null];
}

function get_grade(item) {
    return (typeof window.parent.G.items[item.name].grades != "undefined" ? window.parent.G.items[item.name].grades : [0, 0]);
}

function use_potion(type) {
    if (new Date() < parent.next_potion) return;
    window.parent.use(type);
}

function can_move_to(x,y) {
	if(is_object(x)) y=x.real_y,x=x.real_x;
	return window.parent.can_move({
		map:window.parent.character.map,
		x:window.parent.character.real_x,
		y:window.parent.character.real_y,
		going_x:x,
		going_y:y,
		base:window.parent.character.base
	});
}

function getBestClosestTarget(max) {
	var best = 999999999999;
	var char = window.parent.character;
	var tmp = false;
	var dist = -1;
	max = (typeof max != "undefined" ? max : 9999999999);
	

	$.each(window.parent.entities, function(id, data) {
		if (data.type == "monster" && !data.target && data.hp == data.max_hp && can_move_to(data)) {
			var dist = distanceToPoint(char.real_x, char.real_y, data.real_x, data.real_y);
			if (dist < best) {
				best = dist;
				tmp = id;
			}
		}
	});

	// if (!tmp || dist == -1 || (dist > max)) return;
	return {id: tmp, dist: best};
}

function speech(msg) {
    window.socket.emit("say", {
        "message": msg
    });
}

// function target(id) {
//     window.socket.emit("target", {
//         "id": id
//     });
// }

function attack(id) {
    window.socket.emit("attack", {
        "id": id
    });
}

function ress() {
    window.parent.socket.emit('respawn');
}

function injection_engine(packet) {
    var packet_id = packet.data[0];
    switch (packet_id) {
        case 'death':
            var id = packet.data[1].id;
            break;
        case 'hit':
            var attacker = packet.data[1].hid;
            var target = packet.data[1].id;
            var damage = packet.data[1].damage;
            break;
    }
}
if (getCookie("injConf")) {
    injConf = JSON.parse(getCookie("injConf"));
} else {
    updateCookie();
}
var modalStyle = '<!-- Injection Engine Style --><style type="text/css">#injection_engine .box {position: fixed; width: 400px; z-index: 310; bottom: 50%; left: 0px; background-color: black; border: 5px solid gray; padding: 2px; display: inline-block; } #injection_engine .title {margin-top: 0; margin-bottom: 10px; } #injection_engine .author, #injection_engine .author a:visited, #injection_engine .author a:active {text-align: right; font-size: 18px; color: #FFF; } #injection_engine .actions button {background-color: #000; border: 0; color: #FFF; cursor: pointer; } #injection_engine .actions button span.on {color: green; } #injection_engine .actions button span.off {color: red; } #injection_engine div .item:first-child {margin-left: 0px; } #injection_engine div .item {background: black; /*position: absolute;*/ /*bottom: -2px;*/ /*left: -2px;*/ width: 60px; height: 60px; margin-left: 10px; float: left; border: 2px solid gray; padding: 3px; overflow: hidden; } #injection_engine div .item .boxItm {overflow: hidden; height: 40px; padding-left: 10px; width: 40px; } #injection_engine div .item .boxItm img {width: 640px; height: 2160px; } #injection_engine div .item .count {border: 2px solid gray; background: black; padding: 1px 2px 1px 3px; position: relative; height: 16px; width: 51px; text-align: center; line-height: 16px; height: 16px; font-size: 14px; color: #FFF; left: 0px; bottom: 0px; } .mpot0 {margin-top: -840px; margin-left: -200px; } .mpot1 {margin-top: -840px; margin-left: -280px; } .hpot0 {margin-top: -840px; margin-left: -160px; } .hpot1 {margin-top: -840px; margin-left: -240px; }</style>';
var modalHtml = '<!-- Injection Engine HTML --><!-- Injection Engine HTML --> <div class="box" id="injection_engine"> <h2 class="title" style="text-align: center;"> Injection Engine - ' + version + '</h2> <hr/> <h4 class="title" style="color: orange;"> Hunt Session </h4> <hr/> <h4 class="title" style="color: orange;"> Profits </h4> <hr/> <h4 class="title" style="color: orange;"> Auto Buy </h4> <div style="display: flex; width: 100%;"> <div class="item"> <div class="boxItm"> <img src="/images/tiles/items/pack_20.png?v=39" class="mpot0"> </img> </div> <input maxlength="3" type="number" min="0" step="1" class="count" value="' + injConf.buy_items['mpot0'] + '" id="tot_mpot0" /> </div> <div class="item"> <div class="boxItm"> <img src="/images/tiles/items/pack_20.png?v=39" class="mpot1"> </img> </div> <input maxlength="3" type="number" min="0" step="1" class="count" value="' + injConf.buy_items['mpot1'] + '" id="tot_mpot1" /> </div> <div class="item"> <div class="boxItm"> <img src="/images/tiles/items/pack_20.png?v=39" class="hpot0"> </img> </div> <input maxlength="3" type="number" min="0" step="1" class="count" value="' + injConf.buy_items['hpot0'] + '" id="tot_hpot0" /> </div> <div class="item"> <div class="boxItm"> <img src="/images/tiles/items/pack_20.png?v=39" class="hpot1"> </img> </div> <input maxlength="3" type="number" min="0" step="1" class="count" value="' + injConf.buy_items['hpot1'] + '" id="tot_hpot1" /> </div> </div> <hr/> <div class="actions"> <button id="btn_auto_hunt" onclick="toggle_auto_hunt();"> Auto Hunt: <span class="' + (injConf.hunt ? 'on' : 'off') + '">' + (injConf.hunt ? 'on' : 'off') + '</span> </button> <br/> <button id="btn_auto_drink" onclick="toggle_auto_drink();"> Auto Drink: <span class="' + (injConf.drink ? 'on' : 'off') + '">' + (injConf.drink ? 'on' : 'off') + '</span> </button> <br/> <button id="btn_auto_buy" onclick="toggle_auto_buy();"> Auto Buy: <span class="' + (injConf.buy ? 'on' : 'off') + '">' + (injConf.buy ? 'on' : 'off') + '</span> </button> <br/> <button id="btn_auto_loot" onclick="toggle_auto_loot();"> Auto Loot: <span class="' + (injConf.loot ? 'on' : 'off') + '">' + (injConf.loot ? 'on' : 'off') + '</span> </button> <br/> <button id="btn_party" onclick="toggle_party();"> Party Mode: <span class="off">off</span> </button> </div> <div class="author"> <small> Developed by: <a href="https://github.com/joaoescribano/AdventureLand-InjectionEngine" target="_blank"> git@joaoescribano </a> </small> </div> </div>';
$("body").append(modalStyle);
setTimeout(function() {
    console.clear();
    window.parent.clear_game_logs();
    window.parent.add_log("Injection Engine - " + version, "red");
    if ($("#injection_engine").length) {
        $("#injection_engine").fadeOut("fast");
        $("#injection_engine").html(modalHtml);
        window.parent.add_log("Dashboard updated", "orange");
    } else {
        $("body").append(modalHtml);
        $("#injection_engine").html(modalHtml); // Fix for style not loading at first time ??
        $("#toprightcorner").append('<div class="gamebutton injb" onclick="toggle_injection()">Injection Engine</div>');
        window.parent.add_log("Dashboard loaded", "green");
    }
    $("body").on("change", ".item .count", function() {
        var total = $(this).val();
        var item = $(this).parent().find("img").eq(0).attr("class");
        injConf.buy_items[item] = parseInt(total);
        updateCookie();
    });
    window.socket.onevent = function(packet) {
        injection_engine(packet);
        original_onevent.apply(window.socket, arguments);
    };
    window.parent.add_log("Packet Interceptor Loaded", "blue");
    window.parent.add_log("<hr/>");
}, 1000);
/* Ticking */
var coords = {
    "start": {
        "x": window.parent.character.real_x,
        "y": window.parent.character.real_y
    }
};
var hasDied, deathMoving, potionMoving = false;
var huntTickFn = function() {
    if (window.parent.character.rip) {
        hasDied = true;
        ress();
    } else {
        if (hasDied == true) {
            if (deathMoving == true) {
                return;
            }
            deathMoving = true;
            code_eval("smart_move(" + JSON.stringify(coords['start']) + ", function() {\
				window.parent.deathMoving = false;\
				window.parent.hasDied = false;\
			});");
        }
        if (injConf.drink) {
            var totHp0 = inventory_item_quantity("hpot0");
            var totHp1 = inventory_item_quantity("hpot1");
            var totMp0 = inventory_item_quantity("mpot0");
            var totMp1 = inventory_item_quantity("mpot1");
            if (totHp1 > 0) {
                if (window.parent.character.hp <= (window.parent.character.max_hp - 400)) {
                    use_potion("hp");
                    console.log("hpot1");
                    huntSession.gold_spent += window.parent.G.items["hpot1"].g;
                }
            } else if (totHp0 > 0) {
                if (window.parent.character.hp <= (window.parent.character.max_hp - 200)) {
                    use_potion("hp");
                    console.log("hpot0");
                    huntSession.gold_spent += window.parent.G.items["hpot0"].g;
                }
            }
            if (totMp1 > 0) {
                if ((window.parent.character.mp >= 400 && window.parent.character.mp <= (window.parent.character.max_mp - 400)) || window.parent.character.mp < 50) {
                    use_potion("mp");
                    console.log("mpot1");
                    huntSession.gold_spent += window.parent.G.items["mpot1"].g;
                }
            } else if (totMp0 > 0) {
                if ((window.parent.character.mp >= 200 && window.parent.character.mp <= (window.parent.character.max_mp - 200)) || window.parent.character.mp < 50) {
                    use_potion("mp");
                    console.log("mpot0");
                    huntSession.gold_spent += window.parent.G.items["mpot0"].g;
                }
            }
        }
    }
    if (injConf.buy) {
        var totHp0 = (injConf.buy_items['hpot0'] ? inventory_item_quantity("hpot0") : 999999);
        var totHp1 = (injConf.buy_items['hpot1'] ? inventory_item_quantity("hpot1") : 999999);
        var totMp0 = (injConf.buy_items['mpot0'] ? inventory_item_quantity("mpot0") : 999999);
        var totMp1 = (injConf.buy_items['mpot1'] ? inventory_item_quantity("mpot1") : 999999);
        if (totHp0 <= 5 || totHp1 <= 5 || totMp0 <= 5 || totMp1 <= 5) {
            if (potionMoving) {
                return;
            }
            potionMoving = true;
            code_eval('smart_move("potions", function() {\
					if (' + totHp0 + ' < ' + injConf.buy_items['hpot0'] + ') {\
						buy("hpot0", ' + (injConf.buy_items['hpot0'] - totHp0) + ');\
					}\
					if (' + totHp1 + ' < ' + injConf.buy_items['hpot1'] + ') {\
						buy("hpot1", ' + (injConf.buy_items['hpot1'] - totHp1) + ');\
					}\
					if (' + totMp0 + ' < ' + injConf.buy_items['mpot0'] + ') {\
						buy("mpot0", ' + (injConf.buy_items['mpot0'] - totMp0) + ');\
					}\
					if (' + totMp1 + ' < ' + injConf.buy_items['mpot1'] + ') {\
						buy("mpot1", ' + (injConf.buy_items['mpot1'] - totMp1) + ');\
					}\
					window.parent.potionMoving = false;\
					window.parent.deathMoving = false;\
					window.parent.hasDied = true;\
					return;\
				})');
        }
    }

    if (injConf.loot) {
    	code_eval('loot()');
    }

    if (window.parent.character.moving) return;

    if (attacking != null && typeof window.parent.entities[attacking] != "undefined") {
    	var char = window.parent.character;
    	var id = attacking;

    	var TMPtarget = window.parent.entities[id];

    	var dist = distanceToPoint(char.real_x, char.real_y, TMPtarget.real_x, TMPtarget.real_y)

    	if (distanceToPoint(char.real_x, char.real_y, TMPtarget.real_x, TMPtarget.real_y) > char.range || !can_move_to(TMPtarget)) {
	        window.parent.move(char.real_x + (TMPtarget.real_x - char.real_x) / 2, char.real_y + (TMPtarget.real_y - char.real_y) / 2);
	    } else {
	        code_eval('attack(parent.entities['+id+'])');
	    }
	    return;
    } else {
    	attacking = null;
    }

    var info = getBestClosestTarget(200);
	if (info) {
		attacking = info.id;
    }
};

if (injConf.hunt) {
    huntTick = setInterval(huntTickFn, 100);
}