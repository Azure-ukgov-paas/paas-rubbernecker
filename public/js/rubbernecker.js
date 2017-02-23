var App = {
    config: {
        hash: {},
        updateCheck: null,
        updatePending: null,
        countdowns: []
    },

    checkForUpdates: function () {
        if (App.config.updatePending !== null) {
            return;
        }

        $.ajax({
            url: "/",
            type: "GET",
            beforeSend: function (xhr) {
                xhr.setRequestHeader('x-rubbernecker-state', currentState);
            },
            success: function (data, textStatus, xhr) {
                if (data.state === 'dirty') {
                    $('.update').slideDown();
                    App.config.updatePending = setTimeout(App.refresh, 30 * 1000); // Refresh page in about 30 seconds.
                    App.setupCountdown('state', 30, '.update p span');
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error('Failed to obtain the update response.');
                console.debug(jqXHR, textStatus, errorThrown);
            }
        });
    },

    changeHash: function () {
        var string = '';

        $.each(App.config.hash, function (key, value) {
            if (string !== '') {
                string = string + '&';
            }

            if (key !== '' || value !== undefined) {
                string = string + key + '=' + value;
            }
        });

        if (string.length) {
            window.location.hash = '#' + string;
        }
    },

    checkHash: function (e) {
        $.each(App.config.hash, function (key, value) {
            if (App.config.hash[key] === undefined) {
                return;
            }

            var $switch = $('[data-switch="' + key + '"][data-value="' + value + '"]');

            $switch.trigger('click');
        });
    },

    disableUpdates: function (e) {
        if (App.config.updateCheck !== null) {
            clearInterval(App.config.updateCheck);
            App.config.updateCheck = null;
        }

        if (App.config.updatePending !== null) {
            clearTimeout(App.config.updatePending);
            App.config.updatePending = null;
        }

        $('.board-updates [data-switch="on"]').removeClass('active');
        $('.board-updates [data-switch="off"]').addClass('active');

        $('.update').slideUp();

        console.debug('Updates have been disabled.');
    },

    enableUpdates: function (seconds) {
        if (App.config.updateCheck === null) {
            App.config.updateCheck = setInterval(App.checkForUpdates, seconds * 1000);

            console.debug('Updates have been enabled.');
        }
    },

    gracefulIn: function ($elements) {
        $elements.each(function () {
            var $element = $(this);

            if (!$element.is(':hidden')) {
                return;
            }

            $element.css('opacity', 0);
            $element.slideDown();

            setTimeout(function () {
                $element.animate({
                    opacity: 1
                });
            }, 500);
        });
    },

    gracefulOut: function ($elements) {
        $elements.each(function () {
            var $element = $(this);

            if ($element.is(':hidden')) {
                return;
            }

            $element.css('opacity', 1);
            $element.animate({
                opacity: 0
            });

            setTimeout(function () {
                $element.slideUp();
            }, 500);
        });
    },

    readHash: function () {
        var urlHash = window.location.hash.slice(1),
            hash = urlHash.split('&'),
            config = {};

        $.each(hash, function (key, value) {
            var attr = value.split('=');

            config[attr[0]] = attr[1];
        });

        App.config.hash = config;
    },

    refresh: function () {
        location.reload();
    },

    setupCountdown: function (name, seconds, element) {
        $(element).attr('data-seconds', seconds).text(seconds);

        clearInterval(App.config.countdowns[name]);

        App.config.countdowns[name] = setInterval(function () {
            var left = $(element).attr('data-seconds') - 1;

            if (left < 0) {
                return;
            }

            $(element).attr('data-seconds', left).text(left);
        }, 1000);
    },

    toggleMenu: function (e) {
        e.preventDefault();

        $('div.options').toggleClass('active');

        return false;
    },

    toggleCards: function (e) {
        var target = $(this).attr('data-target'),
            toHide = $(this).attr('data-hide');

        // Show all the stories.
        App.gracefulIn($(target));

        // Hide other elements if possible.
        if (toHide) {
            App.gracefulOut($(target).filter(toHide));
        }
    },

    toggleSwitch: function (e) {
        e.preventDefault();

        var $switches = $(this).parent().find('a[data-switch]'),
            switchName = $(this).attr('data-switch'),
            switchValue = $(this).attr('data-value') || $(this).text().toLowerCase();

        if ($(this).hasClass('active')) {
            return;
        }

        App.config.hash[switchName] = switchValue;

        // Toggle active class.
        $switches.filter('.active').removeClass('active');
        $(this).addClass('active');

        App.changeHash();

        console.debug('Switch "' + switchName + '" has been set to "' + switchValue + '".');

        return false;
    }
};

$(document)
    .ready(function () {
        App.readHash();

        $('body')
            .on('click', '[data-switch="team"], [data-switch="neutral"]', App.toggleCards)
            .on('click', 'div.options .handler', App.toggleMenu)
            .on('click', '.update [data-trigger="cancel"], [data-switch="updates"][data-value="off"]', App.disableUpdates)
            .on('click', '[data-switch="updates"][data-value="on"]', setupUpdates)
            .on('click', '.update [data-trigger="refresh"]', App.refresh)
            .on('click', '[data-switch]', App.toggleSwitch)
            .ready(App.checkHash);

        setupUpdates();

        //////////

        function setupUpdates() {
            App.enableUpdates(30); // Enable updates every 30 seconds.
        }
    });