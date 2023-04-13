/********* START OF SCRIPT *********/

$(function(){

    //This is only for storing static and dynamic UI Elements
    const UIController = (() => {
        
        //Add static UI Elements here
        const DOMElements = {
            documentEle : $(document),
            bodyEle : $('body'),
            // Page blocks
            mainEle : $('.main'),
            setupEle : $('.setup'),
            gameEle : $('.game'),
            resultEle : $('.statistics'),

            // Buttons
            allButtons : $('button'),
            playButton : $('.play-btn'),
            mainMenu : $('.main-menu-btn'),
            gameStatsBtn : $('.stats-btn'),

            // game elements
            gameArena : $('.game-arena'),
            resultText : $('.result .result-text'),
            heroEle : $('.hero'), 
            leftEnemyParent :$('.main .game .left-enemies'),
            rightEnemyParent :$('.main .game .right-enemies'),
            enemyHitTime : $('.enemy-hit-time .progress-bar'),

            // Statstics elements
            scoreEle: $('.score'),
            gameOverEle: $('.game-over'),
            gamesPlayed : $('.statistics .games-played'),
            highScore : $('.statistics .highest-score'),
            kickSound : $('#kick-sound')[0],

            //Dynamically added UI Elements should be handled as functions
            nearestEnemy : function() {
                return $('.game .nearest-enemy');
            },
            leftEnemy : function() {
                return $('.main .game .left-enemies .enemy');
            },
            rightEnemy : function() {
                return $('.main .game .right-enemies .enemy');
            },
        };

        // Return the DOMElements object to be used by controller function
        return {
            getDOMElements : () => DOMElements
        }
    })();

    // This is only for UI manipulation
    const gameController = (() => {

        return {
            // 
            generateEnemies : function (container, limitNum) {
                for(let i=1; i <= limitNum.val(); i++){
                    container.append(`<li class="d-inline-block">
                    <button class="num new-num btn btn-dark font-weight-bold btn-lg m-3">${i}</button></li>`);
                }
                return this;
            },

            // This will add html content to the element passed
            addContent : function (ele, content) {
                ele.html(content);
                return this;
            },

            // Empty the content for element passed
            emptyEle : function (ele) {
                ele.html('');
                return this;
            },

            //Add or remove the class for ele element. If there is no class to add, pass "addcls" as false
            addRemoveCls : function (ele, addcls, removecls){
                addcls && $(ele).addClass(addcls);
                removecls && $(ele).removeClass(removecls);
                return this;
            },

            // Change attribute value for an element
            attrChange : function (ele, atrname, atrval) {
                ele.prop(atrname, atrval);
                return this;
            },

            // Returns parent/s element for an element
            returnParent : function (ele, data) {
                if(data) {
                    return $(ele.parents(`.${data}`));
                }
                return $(ele.parent());
            },

            // Returns parent/s sibling element for an element
            returnParentSibling : function (ele, parent, sibling) {
                if(parent && sibling) {
                    return $(ele.parents(`.${parent}`).siblings(`.${sibling}`));
                }
            },

            // Add focus to the element
            addFocus : function (ele) {
                ele.focus();
                return this;
            },

            // Triggers the event to element
            triggerEvent : function (ele, action) {
                ele.trigger(action);
                return this;
            },

            // Add passed css json object for the element
            addCSS : function (ele, css) {
                const cssObj = JSON.parse(css);
                ele.css(cssObj);
                return this;
            },

            // Remove an element from DOM
            removeEle : function (ele) {
                ele.remove();
                return this;
            },

            // append html content
            appendHTML : function (ele, content) {
                ele.append(content);
                return this;
            },
            // prepend html content
            prependHTML : function (ele, content) {
                ele.prepend(content);
                return this;
            },
            // checks if the element has that class
            hasCls : function(ele, cls){
                ele.hasClass(cls);
                return this;
            }
        }
    })();

    // GLOBAL APP CONTROLLER
    const controller = ((gameCtrl, UICtrl) => {

        // Storing DOM elements
        const DOM = UICtrl.getDOMElements();

        // Setting initial values for gameObj, which will be created by gameObject class, once game is started
        const gameObj = {
            start : null,
            over : false,
            score : 0,
            enemyList : [],
            nearestEnemySide : "",
            stopEnemies : null,
            enemyHitDuration: 3000,
            correctKick : false,
            EnemyCount : Math.floor((window.outerWidth-56)/2/41),
            gamesPlayedLocalStorage : function(key) {
                localStorage && localStorage[key] ? localStorage[key] = +localStorage[key]+1 : localStorage[key] = "0";
            },
            highScoreLocalStorage : function(key, score) {
                localStorage && localStorage[key] ? localStorage[key] < score ? localStorage[key] = score : null  : localStorage[key] = "0";
            }
        };

        // game object class
        class gameObject {
            constructor() {
                
                // Random Number Generator for left/right enemy 0-left 1-right
                this.randomGenerator = function () {
                    return (Math.round(Math.random()));
                }

                //Enemy Array
                this.ememyArray = function(){
                    let side = this.randomGenerator();
                    let nearest = gameObj.enemyList[0];
                    gameObj.enemyList.push(side);
                    
                    if(side){
                        gameCtrl.appendHTML(DOM.rightEnemyParent, `<div class="enemy hero-flip"></div>`)
                                .prependHTML(DOM.leftEnemyParent, `<div class="enemy empty-enemy"></div>`);
                    }
                    else{
                        gameCtrl.prependHTML(DOM.leftEnemyParent, `<div class="enemy"></div>`)
                                .appendHTML(DOM.rightEnemyParent, `<div class="enemy empty-enemy hero-flip"></div>`);
                    }
                }

                this.nearestEnemy = function(){
                    if(!DOM.nearestEnemy().length){
                        if(DOM.rightEnemy().first().hasClass('empty-enemy')){
                            gameCtrl.addRemoveCls(DOM.leftEnemy().last(),'nearest-enemy');
                            gameObj.nearestEnemySide = "left";
                        }
                        else{
                            gameCtrl.addRemoveCls(DOM.rightEnemy().first(),'nearest-enemy');
                            gameObj.nearestEnemySide = "right";
                        }
                    }
                }
            }
        }

        // This functions is for all User interactions events
        const setupEvents = () => {
            
            DOM.allButtons.on('click', function(event) {
                event.preventDefault();

                if( this.dataset.parent && this.dataset.show ) {
                    gameCtrl.addRemoveCls(gameCtrl.returnParentSibling($(this), this.dataset.parent, this.dataset.show), 'd-block', 'd-none')
                            .addRemoveCls(gameCtrl.returnParent($(this), this.dataset.parent), 'd-none', 'd-block');
                }
                
            });

            const kickSound = function(){
                if(DOM.kickSound.duration > 0 && !DOM.kickSound.paused){
                    DOM.kickSound.pause();
                    DOM.kickSound.currentTime = 0;
                    DOM.kickSound.play();
                }
                else{
                    DOM.kickSound.play();
                }
            }

            // This will reset all the values to beginning values
            const resetGame = function() {

                DOM.enemyHitTime.stop();
                gameObj.highScoreLocalStorage("oneKickHighScore", gameObj.score);

                // Setting back the gameObj to original values
                gameObj.start = null;
                gameObj.score = 0;
                gameObj.over = true;
                gameObj.enemyList = [];
                gameObj.nearestEnemySide = "";
                gameObj.correctKick = false;

                if(DOM.gameEle.is(':visible')){
                    gameCtrl.addRemoveCls(DOM.gameEle,'d-none','d-block')
                            .addRemoveCls(DOM.resultEle,'d-block','d-none');
                }
                gameCtrl.addRemoveCls(DOM.gameArena,false,'justify-content-center d-inline-flex')
                        .addRemoveCls(DOM.heroEle,'mx-auto','hero-flip')
                        .addCSS(DOM.enemyHitTime, `{"width": "100%"}`)
                        .emptyEle(DOM.leftEnemyParent)
                        .emptyEle(DOM.rightEnemyParent)
                        .addContent(DOM.gamesPlayed, localStorage['oneKickGamesPlayed'])
                        .addContent(DOM.highScore, localStorage['oneKickHighScore']);
                clearInterval(gameObj.stopEnemies);
            }

            const enemyHit = function(enemyHitTimeWidthArg){
                
                gameObj.enemyHitDuration = gameObj.score < 100 ? 3000 : gameObj.score >= 100 & gameObj.score <200 ? 2000 : 1000;

                    let currentEnemyHitTimeWidth = DOM.enemyHitTime.width();
                    let currentEnemyHitTimeWidthPercent = currentEnemyHitTimeWidth/enemyHitTimeWidthArg;

                    gameObj.enemyHitDuration > 1000 ? currentEnemyHitTimeWidthPercent < 0.3 ? currentEnemyHitTimeWidthPercent = currentEnemyHitTimeWidthPercent*2: null: currentEnemyHitTimeWidthPercent = 1;
                    DOM.enemyHitTime.animate({
                        width: 0
                    },{duration: gameObj.enemyHitDuration*currentEnemyHitTimeWidthPercent, queue: false}).promise().done(function(){
                        if(!gameObj.correctKick){
                            setTimeout(() => {
                                resetGame();
                            },300);
                            if(gameObj.enemyList.length === 15 && DOM.gameEle.is(':visible')){
                                gameCtrl.addRemoveCls(DOM.nearestEnemy(), 'kick')
                                        .addRemoveCls(DOM.heroEle, 'explode');
                                kickSound();
                            }  
                        } 
                    });
            }

            // Start the Game everytime Play button is clicked
            DOM.playButton.on('click', function(event){
                jQuery.fx.off = true;
                // Unbind keyup event as kick should be enabled only after the enemy reaches the hero 
                DOM.documentEle.unbind('keyup');
                gameObj.start = gameObj.start || new gameObject();
                gameObj.start.enemyReached = false;
                gameObj.over = false;
                gameObj.gamesPlayedLocalStorage('oneKickGamesPlayed');
                DOM.scoreEle.text(gameObj.score);
                gameCtrl.addRemoveCls(DOM.gameArena,'justify-content-center d-inline-flex')
                        .addRemoveCls(DOM.heroEle, false, 'explode');

                const enemyHitTimeWidth = DOM.enemyHitTime.width();
                console.log(enemyHitTimeWidth);
                // This method will keep adding enemies for every 300 milliseconds until the enemies length reach 15        
                gameObj.stopEnemies = setInterval(function(){
                    gameObj.start.ememyArray();
                    gameObj.start.nearestEnemy();
                    if(gameObj.enemyList.length === gameObj.EnemyCount){
                        jQuery.fx.off = false;
                        enemyHit(enemyHitTimeWidth);
                        clearInterval(gameObj.stopEnemies);
                        gameObj.start.enemyReached = true;
                        gameCtrl.addRemoveCls(DOM.gameArena,'justify-content-center d-inline-flex')
                                .addRemoveCls(DOM.heroEle,false,'mx-auto');
                    }
                    else {
                    }
                 },300);   
                    DOM.documentEle.on('keyup', function(event){
                        event.preventDefault();
                        // This is the setTimeOut time for increasing enemy hit time width
                        let bloodTime = 150;
                        
                        // Check if the game started and enemy reached
                        if(gameObj.start && gameObj.start.enemyReached === true){
                            if(event.which == 37 || event.which == 39){
                                let kick = "";
                                kickSound();

                                // remove the kick class after 200 milliseconds
                                setTimeout(function(){
                                    gameCtrl.addRemoveCls(DOM.heroEle,false,'kick');
                                },200);
                                
                                // Add hero-flip and kick class for left kick
                                if(event.which == 37){
                                    kick = "left";
                                    gameCtrl.addRemoveCls(DOM.heroEle,'hero-flip kick');
                                    
                                }
                                // Remove hero-flip and add kick class for right kick
                                else if(event.which == 39){
                                    kick = "right";
                                    gameCtrl.addRemoveCls(DOM.heroEle,'kick','hero-flip');
                                }
                                
                                // If kick is same side as nearest enemy side
                                if(kick === gameObj.nearestEnemySide) {
                                    // increase score by 1
                                    gameObj.score++;
                                    // This is kept true so enemy hit time width increase can be executed without being interrupted by enemyHit() method
                                    gameObj.correctKick = true;
                                    DOM.scoreEle.text(gameObj.score);
                                    gameCtrl.addRemoveCls(DOM.nearestEnemy(), 'explode');
                                    
                                    // execute enemy hit time increase after 10 milliseconds as it was not working immediately
                                    setTimeout(() => {
                                        DOM.enemyHitTime.stop();

                                        // Set Enemy hit time width to 100% whenever score reaches dividend of 100
                                        if(gameObj.score % 100 === 0){
                                            gameCtrl.addCSS(DOM.enemyHitTime, `{"width": "+=100%"}`);
                                        }
                                        else{
                                            // Increase Enemy hit time width to 50px for correct kick
                                            gameCtrl.addCSS(DOM.enemyHitTime, `{"width": "+=50px"}`); 
                                            bloodTime = 40;
                                        }
                                    
                                        setTimeout(() => {
                                            // This is set to false so enemyHit() method will be executed
                                            gameObj.correctKick = false;
                                            enemyHit(enemyHitTimeWidth);
                                            },bloodTime);
                                    },10);
                                    
                                    // Execute after 100 milliseconds so kcik effect can be seen
                                    setTimeout(() => {
                                        gameCtrl.removeEle(DOM.nearestEnemy());
                                        if(gameObj.nearestEnemySide === "left"){
                                            gameCtrl.removeEle(DOM.rightEnemy().first());
                                        }
                                        else{
                                            gameCtrl.removeEle(DOM.leftEnemy().last());
                                        }
                                        gameObj.start.nearestEnemy();
                                        // Remove the enemy from enemy list array
                                        gameObj.enemyList.pop();
    
                                        if(gameObj.enemyList.length === gameObj.EnemyCount){
                                            clearInterval(gameObj.stopEnemies);
                                            gameCtrl.addRemoveCls(DOM.gameArena,false,'justify-content-center d-inline-flex')
                                                    .addRemoveCls(DOM.heroEle,false,'mx-auto');
                                        }else{
                                            gameObj.start.ememyArray();
                                            gameObj.start.nearestEnemy();
                                        }
                                    }, 100);
                                    
                                }
                                else{
                                        resetGame();
                                }
                            }
                        }
        
                    });
            })
            

            // This will end game and return to main menu
            DOM.mainMenu.on('click', function() {
                resetGame();
            });

            //Updating game statstics in page
             DOM.gameStatsBtn.on('click', () => {
                gameCtrl.addContent(DOM.gamesPlayed, localStorage['oneKickGamesPlayed'])
                        .addContent(DOM.highScore, localStorage['oneKickHighScore']);
            }); 
        };
        
        // returning only init function
        return {
            init: () => {
                console.info('Welcome to %cONE KICK GAME', "color: yellow; font-weight: bold; background-color: blue;padding: 2px");
                setupEvents();
            }
        }
    })(gameController, UIController);

    // init function triggers setupEvents, which has events functions.
    controller.init();

});

/********* END OF SCRIPT *********/