/* javascript for kwetter microblogger */

/* linkify function taken from http://stackoverflow.com/questions/37684/how-to-replace-plain-urls-with-links/3890175#3890175
*/
function linkify(inputText) {
    var replaceText, replacePattern1, replacePattern2, replacePattern3;

    //URLs starting with http://, https://, or ftp://
    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

    //Change email addresses to mailto:: links.
    replacePattern3 = /(\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,6})/gim;
    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

    return replacedText
}


var Kwetter = {};

Kwetter.limit = 3; 			// default load limit
Kwetter.since = '2010-12-31 12:00:00';	// default date limit
Kwetter.reloadTimeout = 5000;

Kwetter.reloadTimeoutID;
Kwetter.formID;
Kwetter.formInputAvatar;
Kwetter.formInputMessage;
Kwetter.resultID;
Kwetter.loadMoreID;
Kwetter.maxID;

Kwetter.addedRules = new Object();

Kwetter.start = function(formID,inputAvatar,inputMessage,resultID,loadMoreID,maxID)
{
	Kwetter.formID=formID;
	Kwetter.formInputAvatar=inputAvatar;
	Kwetter.formInputMessage=inputMessage;
	Kwetter.resultID=resultID;
	Kwetter.loadMoreID=loadMoreID;
	Kwetter.maxID=maxID;

	var form = jQuery(Kwetter.formID);
	var avatar = form.find(Kwetter.formInputAvatar);
	var message = form.find(Kwetter.formInputMessage);
	form.submit(Kwetter.post);
	Kwetter.search(avatar);
	jQuery(loadMoreID).click(function() {
			Kwetter.limit = 2 * Kwetter.limit;
			Kwetter.search(avatar);
			});
	Kwetter.clear(message);
}

Kwetter.updateStylesheet = function(ids) 
{
	for (var name in ids) {
		cls = '.avatar-' + name;
		if (! Kwetter.addedRules[name]) {
			document.styleSheets[0].insertRule(cls+"{background: url("+window.location.href+"/kwetter.avatar/icon/"+name+") no-repeat scroll 10px 5px;}",0);
			Kwetter.addedRules[name] = 1;
		}
	}
}

Kwetter.post = function(event)
{
	event.preventDefault();
	var action = jQuery(Kwetter.formID).attr("action");
	var form = jQuery(this);
	message = form.find(Kwetter.formInputMessage).val();
	avatar = form.find(Kwetter.formInputAvatar);
	if (message) {
		jQuery.post(action, {avatar:avatar.val(), command:'post', message:message},
				function(data) { Kwetter.search(avatar); });
	}
}

Kwetter.search = function (elem, search, since, limit)
{
	var action = jQuery(Kwetter.formID).attr("action");
	var avatar = elem.val();
	var def_string = typeof(search) != 'undefined' ? search : '';
	var def_since = since || Kwetter.since;
	var def_limit = limit || Kwetter.limit;

	var postargs = { avatar: avatar, command: 'search', since: def_since, limit: def_limit };
	if (def_string) postargs['string'] = def_string;

	jQuery.post(action, postargs, Kwetter.update);

}
Kwetter.timeline = function (elem, since)
{
	var action = jQuery(Kwetter.formID).attr("action");
	var avatar = elem.val();
	if (! since) since='2010-12-31 12:00:00';
	jQuery.post(action, { avatar: avatar, command: 'timeline', since: since, }, Kwetter.update);
}

Kwetter.clear = function (elem)
{
	if (elem.attr("placeholder")) {
		elem.val(elem.attr("placeholder"));
		jQuery(Kwetter.maxID).html(140);
	}
	elem.click(function() { 
		window.clearTimeout(Kwetter.reloadTimeoutID);
		if (elem.val() == elem.attr("placeholder"))
			elem.val(''); 
	});
	elem.keyup(Kwetter.counter);
}

Kwetter.counter = function (event)
{
	var elem = jQuery(this);
	var curr = elem.val();
	var rest = 140 - curr.length;
	if (rest <= 0) {
		elem.val(curr.substring(0,139));
		rest = 0;
	}
	jQuery(Kwetter.maxID).html(rest);
}

Kwetter.update = function (data)
{
	data = jQuery.parseJSON(data);
	var ids = Object();
	var current = jQuery(Kwetter.resultID).html();
	var out = '<div id="timeline_container">';
	for (var message in data['messages']) {
		var row = data['messages'][message];
		ids[row[1]] = row[1];
		out = out + '<span class="kwetter_msgcontainer' + ' avatar-' + row[1] + '">';
		out = out + '<span class="kwetter_avatar">' + row[4] + '</span>';
		out = out + '<span class="kwetter_message">' + linkify(row[2]) + '</span>';
		out = out + '<span class="kwetter_datetime">' + row[3] +'</span>';
		out = out + '</span>';
	}
	out = out + '</div>';
	if (current != out) {
		jQuery(Kwetter.resultID).hide().html(out).fadeIn(400);
	}
	message = jQuery(Kwetter.formID).find(Kwetter.formInputMessage);
	Kwetter.clear(message);
	Kwetter.updateStylesheet(ids);
	Kwetter.reload(Kwetter.reloadTimeout);
}

Kwetter.reload = function (delay)
{
	var avatar = jQuery(Kwetter.formID).find(Kwetter.formInputAvatar);
	Kwetter.reloadTimeoutID = window.setTimeout(Kwetter.search, delay, avatar);
}


