(function () {

    const {ipcRenderer} = require('electron');
    var updatePhoneInfoInterval = null;

    var inputSearchFound = false;
    var inputTextFound = false;

    function updatePhoneInfo() {
        if (window.Store == undefined || window.Store.Conn == undefined) {
            return;
        }
        ipcRenderer.send('phoneinfoupdate', {
            'info': window.Store.Stream.info,
            'me': "+" + window.Store.Conn.me.split("@")[0],
            'battery': window.Store.Conn.battery,
            'plugged': window.Store.Conn.plugged,
            'platform': window.Store.Conn.platform,
            'phoneActive': window.Store.Stream.phoneActive,
            'phone': {
                'manufacturer': window.Store.Conn.phone.device_manufacturer,
                'model': window.Store.Conn.phone.device_model,
                'mcc': window.Store.Conn.phone.mcc,
                'mnc': window.Store.Conn.phone.mnc,
                'os_build_number': window.Store.Conn.phone.os_build_number,
                'os_version': window.Store.Conn.phone.os_version,
                'wa_version': window.Store.Conn.phone.wa_version
            }
        });
        if (updatePhoneInfoInterval != null) {
            clearInterval(updatePhoneInfoInterval);
            updatePhoneInfoInterval = null;
            setInterval(updatePhoneInfo, 2000)
        }
    }

    console.log("Waiting for DOMContentLoaded");
    document.addEventListener('DOMContentLoaded', function () {
        console.log("DOMContentLoaded event");
        updatePhoneInfoInterval = setInterval(updatePhoneInfo, 500);

        // pass in the target node, as well as the observer options
        var observer = new MutationObserver(function (mutations) {
            console.log("Mutations occurred: ", mutations.length);
            var inputSearch = document.querySelector("input.input-search");
            if (inputSearch && !inputSearchFound) {
                console.log("Adding event listeners");
                document.addEventListener("keydown", function (event) {
                    // cmd+k and cmd+f focuses on search input.
                    if ((event.keyCode === 75 || event.keyCode == 70) && event.metaKey === true)
                        inputSearch.focus();
                });
                inputSearchFound = true;
            }

            var divInputText = document.querySelector("[contenteditable=\"true\"]");
            if (divInputText && !inputTextFound && !divInputText.dataset.ctrlh) {
                console.log("Adding event listeners to input text");
                divInputText.addEventListener('keydown', (e) => {
                    var sel = window.getSelection();
                    var off = sel.anchorOffset;
                    var text = sel.anchorNode.textContent;
                    if (e.ctrlKey && e.key === "h" && off > 0) {
                        sel.anchorNode.textContent = sel.anchorNode.textContent
                        sel.anchorNode.textContent = text.slice(0, off - 1) + text.slice(off);
                        sel.collapse(sel.anchorNode, off - 1);
                        jQuery(sel.anchorNode.parentNode).trigger("change");
                        jQuery(sel.anchorNode.parentNode).trigger("keydown");
                    }
                });
                divInputText.dataset.ctrlh = true;
                inputTextFound = true;
            }

            if (inputTextFound && inputSearchFound) {
                console.log("Disconnecting the observer");
                observer.disconnect();
            }
        });

        var config = {childList: true, subtree: true};
        observer.observe(document.querySelector("body"), config);

    }, false);

    setInterval(function() {
        Array.from(document.querySelectorAll('audio')).map(function(audio) {
            audio.playbackRate = (window.audioRate || 1)
        });
        if (window.audioRate) {
            Array.from(document.querySelectorAll('.meta-audio *:first-child')).map(function(span) {
                span.innerHTML = window.audioRate.toFixed(1) + "x&nbsp;";
            });
        }
    }, 200);

    var NativeNotification = Notification;
    Notification = function(title, options) {
    	var notification = new NativeNotification(title, options);

    	notification.addEventListener('click', function() {
    		ipcRenderer.send('notificationClick');
    	});

    	return notification;
    }

    Notification.prototype = NativeNotification.prototype;
    Notification.permission = NativeNotification.permission;
    Notification.requestPermission = NativeNotification.requestPermission.bind(Notification);

})();
