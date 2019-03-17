var version = "0.1-Alpha";
var battle_list = [];

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
	allowed_monsters: ['Bee']
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

function toggle_injection() {
	if ($("#injection_engine").length) {
		if ($("#injection_engine").is(":visible")) {
			$("#injection_engine").fadeOut("slow");
		} else {
			$("#injection_engine").fadeIn("slow");
		}
	}
}

function speech(msg) {
	window.socket.emit("say", {
	    "message": msg
	});
}

function target(id) {
	window.socket.emit("target", {
	    "id": id
	});
}

function attack(id) {
	window.socket.emit("attack", {
	    "id": id
	});
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

function updateCookie() {
	setCookie("injConf", JSON.stringify(injConf));
}

function toggle_auto_hunt() {
	injConf.hunt = (injConf.hunt ? false : true);
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

if (getCookie("injConf")) {
    injConf = JSON.parse(getCookie("injConf"));
} else {
    updateCookie();
}

var modalStyle = '<!-- Injection Engine Style --><style type="text/css">#injection_engine .box {position: fixed; width: 400px; z-index: 310; bottom: 50%; left: 0px; background-color: black; border: 5px solid gray; padding: 2px; display: inline-block; } #injection_engine .title {margin-top: 0; margin-bottom: 10px; } #injection_engine .author, #injection_engine .author a:visited, #injection_engine .author a:active {text-align: right; font-size: 18px; color: #FFF; } #injection_engine .actions button {background-color: #000; border: 0; color: #FFF; cursor: pointer; } #injection_engine .actions button span.on {color: green; } #injection_engine .actions button span.off {color: red; } #injection_engine div .item:first-child {margin-left: 0px; } #injection_engine div .item {background: black; /*position: absolute;*/ /*bottom: -2px;*/ /*left: -2px;*/ width: 60px; height: 60px; margin-left: 10px; float: left; border: 2px solid gray; padding: 3px; overflow: hidden; } #injection_engine div .item .boxItm {overflow: hidden; height: 40px; padding-left: 10px; width: 40px; } #injection_engine div .item .boxItm img {width: 640px; height: 2160px; } #injection_engine div .item .count {border: 2px solid gray; background: black; padding: 1px 2px 1px 3px; position: relative; height: 16px; width: 51px; text-align: center; line-height: 16px; height: 16px; font-size: 14px; color: #FFF; left: 0px; bottom: 0px; } .mpot0 {margin-top: -840px; margin-left: -200px; } .mpot1 {margin-top: -840px; margin-left: -280px; } .hpot0 {margin-top: -840px; margin-left: -160px; } .hpot1 {margin-top: -840px; margin-left: -240px; }</style>';
var modalHtml = '<!-- Injection Engine HTML --> <div class="box" id="injection_engine"> <h2 class="title" style="text-align: center;"> Injection Engine - '+version+'</h2> <hr/> <h4 class="title" style="color: orange;"> Hunt Session </h4> <hr/> <h4 class="title" style="color: orange;"> Profits </h4> <hr/> <h4 class="title" style="color: orange;"> Auto Buy </h4> <div style="display: flex; width: 100%;"> <div class="item"> <div class="boxItm"> <img src="/images/tiles/items/pack_20.png?v=39" class="mpot0"> </img> </div> <input maxlength="3" type="number" min="0" step="1" class="count" value="'+injConf.buy_items['mpot0']+'" id="tot_mpot0" /> </div> <div class="item"> <div class="boxItm"> <img src="/images/tiles/items/pack_20.png?v=39" class="mpot1"> </img> </div> <input maxlength="3" type="number" min="0" step="1" class="count" value="'+injConf.buy_items['mpot1']+'" id="tot_mpot1" /> </div> <div class="item"> <div class="boxItm"> <img src="/images/tiles/items/pack_20.png?v=39" class="hpot0"> </img> </div> <input maxlength="3" type="number" min="0" step="1" class="count" value="'+injConf.buy_items['hpot0']+'" id="tot_hpot0" /> </div> <div class="item"> <div class="boxItm"> <img src="/images/tiles/items/pack_20.png?v=39" class="hpot1"> </img> </div> <input maxlength="3" type="number" min="0" step="1" class="count" value="'+injConf.buy_items['hpot1']+'" id="tot_hpot1" /> </div> </div> <hr/> <div class="actions"> <button id="btn_auto_hunt" onclick="toggle_auto_hunt();"> Auto Hunt: <span class="'+(injConf.hunt ? 'on' : 'off')+'">'+(injConf.hunt ? 'on' : 'off')+'</span> </button> <br/> <button id="btn_auto_drink" onclick="toggle_auto_drink();"> Auto Drink: <span class="'+(injConf.drink ? 'on' : 'off')+'">'+(injConf.drink ? 'on' : 'off')+'</span> </button> <br/> <button id="btn_auto_buy" onclick="toggle_auto_buy();"> Auto Buy: <span class="'+(injConf.buy ? 'on' : 'off')+'">'+(injConf.buy ? 'on' : 'off')+'</span> </button> <br/> <button id="btn_auto_loot" onclick="toggle_auto_loot();"> Auto Loot: <span class="'+(injConf.loot ? 'on' : 'off')+'">'+(injConf.loot ? 'on' : 'off')+'</span> </button> </div> <div class="author"> <small> Developed by: <a href="https://github.com/joaoescribano/AdventureLand-InjectionEngine" target="_blank"> git@joaoescribano </a> </small> </div> </div>';

$("body").append(modalStyle);

setTimeout(function() {
	console.clear();
	window.parent.clear_game_logs();
	window.parent.add_log("Injection Engine - "+version, "red");

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