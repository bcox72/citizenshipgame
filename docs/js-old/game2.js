
        var modal = function(){}

        var game = {}
        var mode = "play"
        var grid = null;
        var current_cell = null;

        function getCurrentState(){
            var teams = [];
            var teams_dom = document.querySelectorAll(".team");
            for(var i = 0; i < teams_dom.length; i++){
                var t = teams_dom[i];
                var name = t.querySelectorAll(".name")[0].textContent;
                var points = t.querySelectorAll(".points")[0].textContent;
                teams[i] = {name: name, points: points}
            }

            var inerts = {};
            var inert_dom = document.querySelectorAll(".grid-row-questions .inert");
            for(var i = 0; i < inert_dom.length; i++){
                var id = inert_dom[i].getAttribute("id");
                inerts[id] = true;
            }

            return {
                "teams": teams,
                "inerts": inerts,
            }
        }

        function getOldState(){
            try {
                var old_state = localStorage.getItem("game-27893756")
            } catch (e) {
                return null;

            }
            if(old_state){
                return JSON.parse(old_state);
            }
            return null;
        }

        function clearState(){
            try {
                localStorage.removeItem("game-27893756");
            } catch (e) {

            }
        }

        function resize(){
            var bbox_teams = getBoundingClientRect(document.getElementById("teams"))
            var rows = document.querySelectorAll(".grid-row").length;
            if(bbox_teams.height == 0){
                var h = window.innerHeight;
            } else {
                var h = bbox_teams.top + ((window.innerHeight - bbox_teams.height) / (rows))/4
            }

            grid.style.height = h + "px";
            minirender(grid, function(g){
                g.style.opacity = 1;
            }, .6);
        }

        ready(function(){
            grid = document.querySelectorAll(".grid")[0];
            window.addEventListener("resize", debounce(resize, 100, false));
            resize();
            renderState(initial_state);
            document.getElementById("team-chooser").focus();

            window.addEventListener("keydown", function(e){
                var ESC = 27
                var SPACE = 32
                var ENTER = 13;
                var LEFT = 37;
                var UP = 38;
                var RIGHT = 39;
                var DOWN = 40;
                var on_cell = false;
                if(document.activeElement){
                    on_cell = matches(document.activeElement, ".grid-row-questions .grid-cell");
                }
                var clickable = on_cell && !document.activeElement.classList.contains('empty');

                if(modal.is_open){
                    if(e.keyCode == ESC){
                        e.preventDefault();
                        modal.hide();
                    } else if(e.keyCode == SPACE){
                        e.preventDefault();
                        modal.reveal();
                    }
                } else if(on_cell){
                    if((e.keyCode == ENTER || e.keyCode == SPACE) && clickable){
                        e.preventDefault();
                        var event = document.createEvent('HTMLEvents');
                        event.initEvent('click', true, false);
                        document.activeElement.dispatchEvent(event);
                    } else if(e.keyCode == LEFT){
                        e.preventDefault();
                        // find the cell to the left and focus on it
                        if(document.activeElement.previousElementSibling){
                            document.activeElement.previousElementSibling.focus();
                        }
                    } else if(e.keyCode == RIGHT){
                        e.preventDefault();
                        if(document.activeElement.nextElementSibling){
                            document.activeElement.nextElementSibling.focus();
                        }
                    } else if(e.keyCode == UP){
                        e.preventDefault();
                        var my_col = indexInParent(document.activeElement);
                        var previous_row = document.activeElement.parentElement.previousElementSibling;
                        if(previous_row && previous_row.children[my_col] && matches(previous_row.children[my_col], ".grid-row-questions .grid-cell")){
                            previous_row.children[my_col].focus();
                        }
                    } else if(e.keyCode == DOWN){
                        e.preventDefault();
                        var my_col = indexInParent(document.activeElement);
                        var next_row = document.activeElement.parentElement.nextElementSibling;
                        if(next_row && next_row.children[my_col] && matches(next_row.children[my_col], ".grid-row-questions .grid-cell")){
                            next_row.children[my_col].focus();
                        }
                    }
                }
            }, false);

            var debouncedSaveState = debounce(function(){
                try {
                    localStorage.setItem("game-27893756", JSON.stringify(getCurrentState()))
                } catch (e) {

                }
            }, 100, false)

            on("keyup change input blur focus", "#teams .name, #teams .points", debouncedSaveState);

            on("click", "#re-init", function(e){
                e.preventDefault();
                if(confirm("This will clear the scores and team names, and start a new game. Click OK if you want to do this")){
                    clearState();
                    game.init(true);
                }
            })

            on("keyup", "#answer-button", function(e){
                if(e.keyCode == 13){
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    modal.reveal();
                }
            });
            on("click", "#answer-button", function(e){
                modal.reveal();
            })

            on("keyup", "#continue-button", function(e){
                if(e.keyCode == 13){
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    modal.hide();
                }
            });
            on("click", "#continue-button", function(e){
                modal.hide();
            })

            on("click", ".grid-row-questions .grid-cell", function(e){
                current_cell = this;
                modal.show(this);
            });

            // prevent the buttons from being highlighted
            on("mousedown", ".minus, .plus", function(e){
                e.preventDefault();
            });

            on("keydown", ".minus, .plus", function(e){
                if(e.keyCode == 13){
                    handlePoints.call(this, e);
                }
            })

            function handlePoints(e){
                var $team = closest(this, ".team");
                var $points = $team.querySelectorAll(".points")[0];
                var points = parseInt($points.innerText, 10);
                if(isNaN(points)){
                    alert("Error! The score for this team is not a number. You need to edit the score and change it to a number.");
                    return
                }
                var active_question = document.querySelectorAll(".active-question .cell-inner")[0];
                var fallback = document.querySelectorAll(".grid-row-questions .cell-inner")[0];
                var val = parseInt(active_question ? active_question.innerText : fallback.innerText, 10);
                if(this.classList.contains("minus")){
                    val = -val;
                }
                $points.innerText = points + val;
                if(active_question){
                    document.querySelectorAll(".active-question")[0].classList.add("inert");
                }
                debouncedSaveState();

            }

            // handle points clicks
            on("click", ".minus, .plus", handlePoints);
        });
