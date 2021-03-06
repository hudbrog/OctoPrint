//~~ View models

function ConnectionViewModel() {
    var self = this;

    self.portOptions = ko.observableArray(undefined);
    self.baudrateOptions = ko.observableArray(undefined);
    self.selectedPort = ko.observable(undefined);
    self.selectedBaudrate = ko.observable(undefined);
    self.saveSettings = ko.observable(undefined);

    self.isErrorOrClosed = ko.observable(undefined);
    self.isOperational = ko.observable(undefined);
    self.isPrinting = ko.observable(undefined);
    self.isPaused = ko.observable(undefined);
    self.isError = ko.observable(undefined);
    self.isReady = ko.observable(undefined);
    self.isLoading = ko.observable(undefined);

    self.buttonText = ko.computed(function() {
        if (self.isErrorOrClosed())
            return "Connect";
        else
            return "Disconnect";
    })

    self.previousIsOperational = undefined;

    self.requestData = function() {
        $.ajax({
            url: AJAX_BASEURL + "control/connectionOptions",
            method: "GET",
            dataType: "json",
            success: function(response) {
                self.fromResponse(response);
            }
        })
    }

    self.fromResponse = function(response) {
        self.portOptions(response.ports);
        self.baudrateOptions(response.baudrates);

        if (!self.selectedPort() && response.ports && response.ports.indexOf(response.portPreference) >= 0)
            self.selectedPort(response.portPreference);
        if (!self.selectedBaudrate() && response.baudrates && response.baudrates.indexOf(response.baudratePreference) >= 0)
            self.selectedBaudrate(response.baudratePreference);

        self.saveSettings(false);
    }

    self.fromHistoryData = function(data) {
        self._processStateData(data.state);
    }

    self.fromCurrentData = function(data) {
        self._processStateData(data.state);
    }

    self._processStateData = function(data) {
        self.previousIsOperational = self.isOperational();

        self.isErrorOrClosed(data.flags.closedOrError);
        self.isOperational(data.flags.operational);
        self.isPaused(data.flags.paused);
        self.isPrinting(data.flags.printing);
        self.isError(data.flags.error);
        self.isReady(data.flags.ready);
        self.isLoading(data.flags.loading);

        var connectionTab = $("#connection");
        if (self.previousIsOperational != self.isOperational()) {
            if (self.isOperational() && connectionTab.hasClass("in")) {
                // connection just got established, close connection tab for now
                connectionTab.collapse("hide");
            } else if (!connectionTab.hasClass("in")) {
                // connection just dropped, make sure connection tab is open
                connectionTab.collapse("show");
            }
        }
    }

    self.connect = function() {
        if (self.isErrorOrClosed()) {
            var data = {
                "port": self.selectedPort(),
                "baudrate": self.selectedBaudrate()
            };

            if (self.saveSettings())
                data["save"] = true;

            $.ajax({
                url: AJAX_BASEURL + "control/connect",
                type: "POST",
                dataType: "json",
                data: data
            })
        } else {
            self.requestData();
            $.ajax({
                url: AJAX_BASEURL + "control/disconnect",
                type: "POST",
                dataType: "json"
            })
        }
    }
}

function PrinterStateViewModel() {
    var self = this;

    self.stateString = ko.observable(undefined);
    self.isErrorOrClosed = ko.observable(undefined);
    self.isOperational = ko.observable(undefined);
    self.isPrinting = ko.observable(undefined);
    self.isPaused = ko.observable(undefined);
    self.isError = ko.observable(undefined);
    self.isReady = ko.observable(undefined);
    self.isLoading = ko.observable(undefined);

    self.filename = ko.observable(undefined);
    self.filament = ko.observable(undefined);
    self.estimatedPrintTime = ko.observable(undefined);
    self.printTime = ko.observable(undefined);
    self.printTimeLeft = ko.observable(undefined);
    self.currentLine = ko.observable(undefined);
    self.totalLines = ko.observable(undefined);
    self.currentHeight = ko.observable(undefined);

    self.lineString = ko.computed(function() {
        if (!self.totalLines())
            return "-";
        var currentLine = self.currentLine() ? self.currentLine() : "-";
        return currentLine + " / " + self.totalLines();
    });
    self.progress = ko.computed(function() {
        if (!self.currentLine() || !self.totalLines())
            return 0;
        return Math.round(self.currentLine() * 100 / self.totalLines());
    });
    self.pauseString = ko.computed(function() {
        if (self.isPaused())
            return "Continue";
        else
            return "Pause";
    });

    self.fromCurrentData = function(data) {
        self._fromData(data);
    }

    self.fromHistoryData = function(data) {
        self._fromData(data);
    }

    self._fromData = function(data) {
        self._processStateData(data.state)
        self._processJobData(data.job);
        self._processGcodeData(data.gcode);
        self._processProgressData(data.progress);
        self._processZData(data.currentZ);
    }

    self._processStateData = function(data) {
        self.stateString(data.stateString);
        self.isErrorOrClosed(data.flags.closedOrError);
        self.isOperational(data.flags.operational);
        self.isPaused(data.flags.paused);
        self.isPrinting(data.flags.printing);
        self.isError(data.flags.error);
        self.isReady(data.flags.ready);
        self.isLoading(data.flags.loading);
    }

    self._processJobData = function(data) {
        self.filename(data.filename);
        self.totalLines(data.lines);
        self.estimatedPrintTime(data.estimatedPrintTime);
        self.filament(data.filament);
    }

    self._processGcodeData = function(data) {
        if (self.isLoading()) {
            var progress = Math.round(data.progress * 100);
            if (data.mode == "loading") {
                self.filename("Loading... (" + progress + "%)");
            } else if (data.mode == "parsing") {
                self.filename("Parsing... (" + progress + "%)");
            }
        }
    }

    self._processProgressData = function(data) {
        self.currentLine(data.progress);
        self.printTime(data.printTime);
        self.printTimeLeft(data.printTimeLeft);
    }

    self._processZData = function(data) {
        self.currentHeight(data);
    }
}

function TemperatureViewModel() {
    var self = this;

    self.temp = ko.observable(undefined);
    self.bedTemp = ko.observable(undefined);
    self.targetTemp = ko.observable(undefined);
    self.bedTargetTemp = ko.observable(undefined);

    self.isErrorOrClosed = ko.observable(undefined);
    self.isOperational = ko.observable(undefined);
    self.isPrinting = ko.observable(undefined);
    self.isPaused = ko.observable(undefined);
    self.isError = ko.observable(undefined);
    self.isReady = ko.observable(undefined);
    self.isLoading = ko.observable(undefined);

    self.tempString = ko.computed(function() {
        if (!self.temp())
            return "-";
        return self.temp() + " °C";
    });
    self.bedTempString = ko.computed(function() {
        if (!self.bedTemp())
            return "-";
        return self.bedTemp() + " °C";
    });
    self.targetTempString = ko.computed(function() {
        if (!self.targetTemp())
            return "-";
        return self.targetTemp() + " °C";
    });
    self.bedTargetTempString = ko.computed(function() {
        if (!self.bedTargetTemp())
            return "-";
        return self.bedTargetTemp() + " °C";
    });

    self.temperatures = [];
    self.plotOptions = {
        yaxis: {
            min: 0,
            max: 310,
            ticks: 10
        },
        xaxis: {
            mode: "time",
            minTickSize: [2, "minute"],
            tickFormatter: function(val, axis) {
                if (val == undefined || val == 0)
                    return ""; // we don't want to display the minutes since the epoch if not connected yet ;)

                // calculate current time in milliseconds in UTC
                var now = new Date();
                var timezoneOffset = now.getTimezoneOffset() * 60 * 1000;
                var timestampUtc = now.getTime() + timezoneOffset;

                // calculate difference in milliseconds
                var diff = timestampUtc - val;

                // convert to minutes
                var diffInMins = Math.round(diff / (60 * 1000));
                if (diffInMins == 0)
                    return "just now";
                else
                    return "- " + diffInMins + " min";
            }
        },
        legend: {
            noColumns: 4
        }
    }

    self.fromCurrentData = function(data) {
        self._processStateData(data.state);
        self._processTemperatureUpdateData(data.temperatures);
    }

    self.fromHistoryData = function(data) {
        self._processStateData(data.state);
        self._processTemperatureHistoryData(data.temperatureHistory);
    }

    self._processStateData = function(data) {
        self.isErrorOrClosed(data.flags.closedOrError);
        self.isOperational(data.flags.operational);
        self.isPaused(data.flags.paused);
        self.isPrinting(data.flags.printing);
        self.isError(data.flags.error);
        self.isReady(data.flags.ready);
        self.isLoading(data.flags.loading);
    }

    self._processTemperatureUpdateData = function(data) {
        if (data.length == 0)
            return;

        self.temp(data[data.length - 1].temp);
        self.bedTemp(data[data.length - 1].bedTemp);
        self.targetTemp(data[data.length - 1].targetTemp);
        self.bedTargetTemp(data[data.length - 1].targetBedTemp);

        if (!self.temperatures)
            self.temperatures = [];
        if (!self.temperatures.actual)
            self.temperatures.actual = [];
        if (!self.temperatures.target)
            self.temperatures.target = [];
        if (!self.temperatures.actualBed)
            self.temperatures.actualBed = [];
        if (!self.temperatures.targetBed)
            self.temperatures.targetBed = [];

        for (var i = 0; i < data.length; i++) {
            self.temperatures.actual.push([data[i].currentTime, data[i].temp])
            self.temperatures.target.push([data[i].currentTime, data[i].targetTemp])
            self.temperatures.actualBed.push([data[i].currentTime, data[i].bedTemp])
            self.temperatures.targetBed.push([data[i].currentTime, data[i].targetBedTemp])
        }
        self.temperatures.actual = self.temperatures.actual.slice(-300);
        self.temperatures.target = self.temperatures.target.slice(-300);
        self.temperatures.actualBed = self.temperatures.actualBed.slice(-300);
        self.temperatures.targetBed = self.temperatures.targetBed.slice(-300);

        self.updatePlot();
    }

    self._processTemperatureHistoryData = function(data) {
        self.temperatures = data;
        self.updatePlot();
    }

    self.updatePlot = function() {
        var data = [
            {label: "Actual", color: "#FF4040", data: self.temperatures.actual},
            {label: "Target", color: "#FFA0A0", data: self.temperatures.target},
            {label: "Bed Actual", color: "#4040FF", data: self.temperatures.actualBed},
            {label: "Bed Target", color: "#A0A0FF", data: self.temperatures.targetBed}
        ]
        $.plot($("#temperature-graph"), data, self.plotOptions);
    }
}

function ControlsViewModel() {
    var self = this;

    self.isErrorOrClosed = ko.observable(undefined);
    self.isOperational = ko.observable(undefined);
    self.isPrinting = ko.observable(undefined);
    self.isPaused = ko.observable(undefined);
    self.isError = ko.observable(undefined);
    self.isReady = ko.observable(undefined);
    self.isLoading = ko.observable(undefined);

    self.controls = ko.observableArray([]);

    self.fromCurrentData = function(data) {
        self._processStateData(data.state);
    }

    self.fromHistoryData = function(data) {
        self._processStateData(data.state);
    }

    self._processStateData = function(data) {
        self.isErrorOrClosed(data.flags.closedOrError);
        self.isOperational(data.flags.operational);
        self.isPaused(data.flags.paused);
        self.isPrinting(data.flags.printing);
        self.isError(data.flags.error);
        self.isReady(data.flags.ready);
        self.isLoading(data.flags.loading);
    }

    self.requestData = function() {
        $.ajax({
            url: AJAX_BASEURL + "control/custom",
            method: "GET",
            dataType: "json",
            success: function(response) {
                self._fromResponse(response);
            }
        });
    }

    self._fromResponse = function(response) {
        self.controls(self._enhanceControls(response.controls));
    }

    self._enhanceControls = function(controls) {
        for (var i = 0; i < controls.length; i++) {
            controls[i] = self._enhanceControl(controls[i]);
        }
        return controls;
    }

    self._enhanceControl = function(control) {
        if (control.type == "parametric_command") {
            for (var i = 0; i < control.input.length; i++) {
                control.input[i].value = control.input[i].default;
            }
        } else if (control.type == "section") {
            control.children = self._enhanceControls(control.children);
        }
        return control;
    }

    self.sendJogCommand = function(axis, distance) {
        $.ajax({
            url: AJAX_BASEURL + "control/jog",
            type: "POST",
            dataType: "json",
            data: axis + "=" + distance
        })
    }

    self.sendHomeCommand = function(axis) {
        $.ajax({
            url: AJAX_BASEURL + "control/jog",
            type: "POST",
            dataType: "json",
            data: "home" + axis
        })
    }

    self.sendCustomCommand = function(command) {
        if (!command)
            return;

        if (command.type == "command") {
            $.ajax({
                url: AJAX_BASEURL + "control/command",
                type: "POST",
                dataType: "json",
                data: "command=" + command.command
            })
        } else if (command.type="parametric_command") {
            var data = {"command": command.command};
            for (var i = 0; i < command.input.length; i++) {
                data["parameter_" + command.input[i].parameter] = command.input[i].value;
            }
            $.ajax({
                url: AJAX_BASEURL + "control/command",
                type: "POST",
                dataType: "json",
                data: data
            })
        }
    }

    self.displayMode = function(customControl) {
        switch (customControl.type) {
            case "section":
                return "customControls_sectionTemplate";
            case "command":
                return "customControls_commandTemplate";
            case "parametric_command":
                return "customControls_parametricCommandTemplate";
            default:
                return "customControls_emptyTemplate";
        }
    }

}

function SpeedViewModel() {
    var self = this;

    self.outerWall = ko.observable(undefined);
    self.innerWall = ko.observable(undefined);
    self.fill = ko.observable(undefined);
    self.support = ko.observable(undefined);

    self.isErrorOrClosed = ko.observable(undefined);
    self.isOperational = ko.observable(undefined);
    self.isPrinting = ko.observable(undefined);
    self.isPaused = ko.observable(undefined);
    self.isError = ko.observable(undefined);
    self.isReady = ko.observable(undefined);
    self.isLoading = ko.observable(undefined);

    self._fromCurrentData = function(data) {
        self._processStateData(data.state);
    }

    self._fromHistoryData = function(data) {
        self._processStateData(data.state);
    }

    self._processStateData = function(data) {
        self.isErrorOrClosed(data.flags.closedOrError);
        self.isOperational(data.flags.operational);
        self.isPaused(data.flags.paused);
        self.isPrinting(data.flags.printing);
        self.isError(data.flags.error);
        self.isReady(data.flags.ready);
        self.isLoading(data.flags.loading);
    }

    self.requestData = function() {
        $.ajax({
            url: AJAX_BASEURL + "control/speed",
            type: "GET",
            dataType: "json",
            success: self._fromResponse
        });
    }

    self._fromResponse = function(response) {
        if (response.feedrate) {
            self.outerWall(response.feedrate.outerWall);
            self.innerWall(response.feedrate.innerWall);
            self.fill(response.feedrate.fill);
            self.support(response.feedrate.support);
        } else {
            self.outerWall(undefined);
            self.innerWall(undefined);
            self.fill(undefined);
            self.support(undefined);
        }
    }
}

function TerminalViewModel() {
    var self = this;

    self.log = [];

    self.isErrorOrClosed = ko.observable(undefined);
    self.isOperational = ko.observable(undefined);
    self.isPrinting = ko.observable(undefined);
    self.isPaused = ko.observable(undefined);
    self.isError = ko.observable(undefined);
    self.isReady = ko.observable(undefined);
    self.isLoading = ko.observable(undefined);

    self.autoscrollEnabled = ko.observable(true);

    self.fromCurrentData = function(data) {
        self._processStateData(data.state);
        self._processCurrentLogData(data.logs);
    }

    self.fromHistoryData = function(data) {
        self._processStateData(data.state);
        self._processHistoryLogData(data.logHistory);
    }

    self._processCurrentLogData = function(data) {
        if (!self.log)
            self.log = []
        self.log = self.log.concat(data)
        self.updateOutput();
    }

    self._processHistoryLogData = function(data) {
        self.log = data;
        self.updateOutput();
    }

    self._processStateData = function(data) {
        self.isErrorOrClosed(data.flags.closedOrError);
        self.isOperational(data.flags.operational);
        self.isPaused(data.flags.paused);
        self.isPrinting(data.flags.printing);
        self.isError(data.flags.error);
        self.isReady(data.flags.ready);
        self.isLoading(data.flags.loading);
    }

    self.updateOutput = function() {
        if (!self.log)
            return;

        var output = "";
        for (var i = 0; i < self.log.length; i++) {
            output += self.log[i] + "\n";
        }

        var container = $("#terminal-output");
        container.text(output);

        if (self.autoscrollEnabled()) {
            container.scrollTop(container[0].scrollHeight - container.height())
        }
    }
}

function GcodeFilesViewModel() {
    var self = this;

    self.files = ko.observableArray([]);
    self.pageSize = ko.observable(CONFIG_FILESPERPAGE);
    self.currentPage = ko.observable(0);

    self.paginatedFiles = ko.dependentObservable(function() {
        if (self.files() == undefined) {
            return [];
        } else {
            var from = Math.max(self.currentPage() * self.pageSize(), 0);
            var to = Math.min(from + self.pageSize(), self.files().length);
            return self.files().slice(from, to);
        }
    })
    self.lastPage = ko.dependentObservable(function() {
        return Math.ceil(self.files().length / self.pageSize()) - 1;
    })
    self.pages = ko.dependentObservable(function() {
        var pages = [];
        if (self.lastPage() < 7) {
            for (var i = 0; i < self.lastPage() + 1; i++) {
                pages.push({ number: i, text: i+1 });
            }
        } else {
            pages.push({ number: 0, text: 1 });
            if (self.currentPage() < 5) {
                for (var i = 1; i < 5; i++) {
                    pages.push({ number: i, text: i+1 });
                }
                pages.push({ number: -1, text: "…"});
            } else if (self.currentPage() > self.lastPage() - 5) {
                pages.push({ number: -1, text: "…"});
                for (var i = self.lastPage() - 4; i < self.lastPage(); i++) {
                    pages.push({ number: i, text: i+1 });
                }
            } else {
                pages.push({ number: -1, text: "…"});
                for (var i = self.currentPage() - 1; i <= self.currentPage() + 1; i++) {
                    pages.push({ number: i, text: i+1 });
                }
                pages.push({ number: -1, text: "…"});
            }
            pages.push({ number: self.lastPage(), text: self.lastPage() + 1})
        }
        return pages;
    })

    self.requestData = function() {
        $.ajax({
            url: AJAX_BASEURL + "gcodefiles",
            method: "GET",
            dataType: "json",
            success: function(response) {
                self.fromResponse(response);
            }
        });
    }

    self.fromResponse = function(response) {
        var sortedFiles = response.files;
        sortedFiles.sort(function(a, b) {
            if (a.name.toLocaleLowerCase() < b.name.toLocaleLowerCase()) return -1;
            if (a.name.toLocaleLowerCase() > b.name.toLocaleLowerCase()) return 1;
            return 0;
        });

        self.files(sortedFiles);
    }

    self.loadFile = function(filename) {
        $.ajax({
            url: AJAX_BASEURL + "gcodefiles/load",
            type: "POST",
            dataType: "json",
            data: {filename: filename}
        })
    }

    self.removeFile = function() {
        var filename = this.name;
        $.ajax({
            url: AJAX_BASEURL + "gcodefiles/delete",
            type: "POST",
            dataType: "json",
            data: {filename: filename},
            success: self.fromResponse
        })
    }

    self.changePage = function(newPage) {
        if (newPage < 0 || newPage > self.lastPage())
            return;
        self.currentPage(newPage);
    }
    self.prevPage = function() {
        if (self.currentPage() > 0) {
            self.currentPage(self.currentPage() - 1);
        }
    }
    self.nextPage = function() {
        if (self.currentPage() < self.lastPage()) {
            self.currentPage(self.currentPage() + 1);
        }
    }

}

function WebcamViewModel() {
    var self = this;

    self.timelapseType = ko.observable(undefined);
    self.timelapseTimedInterval = ko.observable(undefined);
    self.files = ko.observableArray([]);

    self.isErrorOrClosed = ko.observable(undefined);
    self.isOperational = ko.observable(undefined);
    self.isPrinting = ko.observable(undefined);
    self.isPaused = ko.observable(undefined);
    self.isError = ko.observable(undefined);
    self.isReady = ko.observable(undefined);
    self.isLoading = ko.observable(undefined);

    self.intervalInputEnabled = ko.computed(function() {
        return ("timed" == self.timelapseType());
    })

    self.isOperational.subscribe(function(newValue) {
        self.requestData();
    })

    self.requestData = function() {
        $.ajax({
            url: AJAX_BASEURL + "timelapse",
            type: "GET",
            dataType: "json",
            success: self.fromResponse
        });
        $("#webcam_image").attr("src", CONFIG_WEBCAM_STREAM + "?" + new Date().getTime());
    }

    self.fromResponse = function(response) {
        self.timelapseType(response.type)
        self.files(response.files)

        if (response.type == "timed" && response.config && response.config.interval) {
            self.timelapseTimedInterval(response.config.interval)
        } else {
            self.timelapseTimedInterval(undefined)
        }
    }

    self.fromCurrentData = function(data) {
        self._processStateData(data.state);
    }

    self.fromHistoryData = function(data) {
        self._processStateData(data.state);
    }

    self._processStateData = function(data) {
        self.isErrorOrClosed(data.flags.closedOrError);
        self.isOperational(data.flags.operational);
        self.isPaused(data.flags.paused);
        self.isPrinting(data.flags.printing);
        self.isError(data.flags.error);
        self.isReady(data.flags.ready);
        self.isLoading(data.flags.loading);
    }

    self.removeFile = function() {
        var filename = this.name;
        $.ajax({
            url: AJAX_BASEURL + "timelapse/" + filename,
            type: "DELETE",
            dataType: "json",
            success: self.requestData
        })
    }

    self.save = function() {
        var data = {
            "type": self.timelapseType()
        }

        if (self.timelapseType() == "timed") {
            data["interval"] = self.timelapseTimedInterval();
        }

        $.ajax({
            url: AJAX_BASEURL + "timelapse/config",
            type: "POST",
            dataType: "json",
            data: data,
            success: self.fromResponse
        })
    }
}

function GcodeViewModel() {
    var self = this;

    self.loadedFilename = undefined;
    self.status = 'idle';
    self.enabled = false;

    self.initialize = function(){
        self.enabled = true;
        GCODE.ui.initHandlers();
    }

    self.loadFile = function(filename){
        if(self.status == 'idle'){
            self.status = 'request';
            $.ajax({
                url: "gcodefile/"+filename,
                type: "GET",
                success: function(response, rstatus) {
                    if(rstatus === 'success'){
                        self.showGCodeViewer(response, rstatus);
                        self.loadedFilename=filename;
                        self.status = 'idle';
                    }
                },
                error: function() {
                    self.status = 'idle';
                }
            })
        }
    }

    self.showGCodeViewer = function(response, rstatus){
        var par = {};
        par.target = {};
        par.target.result = response;
        GCODE.gCodeReader.loadFile(par);
    }

    self.fromHistoryData = function(data) {
        self._processData(data);
    }

    self.fromCurrentData = function(data) {
        self._processData(data);
    }

    self._processData = function(data) {
        if(!self.enabled)return;

        if(self.loadedFilename == data.job.filename){
            var cmdIndex = GCODE.gCodeReader.getLinesCmdIndex(data.progress.progress);
            if(cmdIndex){
                GCODE.renderer.render(cmdIndex.layer, 0, cmdIndex.cmd);
                GCODE.ui.updateLayerInfo(cmdIndex.layer);
            }
        }else{
            self.loadFile(data.job.filename);
        }
    }

}

function DataUpdater(connectionViewModel, printerStateViewModel, temperatureViewModel, controlsViewModel, speedViewModel, terminalViewModel, webcamViewModel, gcodeViewModel) {
    var self = this;

    self.connectionViewModel = connectionViewModel;
    self.printerStateViewModel = printerStateViewModel;
    self.temperatureViewModel = temperatureViewModel;
    self.controlsViewModel = controlsViewModel;
    self.terminalViewModel = terminalViewModel;
    self.speedViewModel = speedViewModel;
    self.webcamViewModel = webcamViewModel;
    self.gcodeViewModel = gcodeViewModel;

    self._socket = io.connect();
    self._socket.on("connect", function() {
        if ($("#offline_overlay").is(":visible")) {
            $("#offline_overlay").hide();
            self.webcamViewModel.requestData();
        }
    })
    self._socket.on("disconnect", function() {
        $("#offline_overlay_message").html(
            "The server appears to be offline, at least I'm not getting any response from it. I'll try to reconnect " +
            "automatically <strong>over the next couple of minutes</strong>, however you are welcome to try a manual reconnect " +
            "anytime using the button below."
        );
        if (!$("#offline_overlay").is(":visible"))
            $("#offline_overlay").show();
    })
    self._socket.on("reconnect_failed", function() {
        $("#offline_overlay_message").html(
            "The server appears to be offline, at least I'm not getting any response from it. I <strong>could not reconnect automatically</strong>, " +
            "but you may try a manual reconnect using the button below."
        );
    })
    self._socket.on("history", function(data) {
        self.connectionViewModel.fromHistoryData(data);
        self.printerStateViewModel.fromHistoryData(data);
        self.temperatureViewModel.fromHistoryData(data);
        self.controlsViewModel.fromHistoryData(data);
        self.terminalViewModel.fromHistoryData(data);
        self.webcamViewModel.fromHistoryData(data);
        self.gcodeViewModel.fromHistoryData(data);
    })
    self._socket.on("current", function(data) {
        self.connectionViewModel.fromCurrentData(data);
        self.printerStateViewModel.fromCurrentData(data);
        self.temperatureViewModel.fromCurrentData(data);
        self.controlsViewModel.fromCurrentData(data);
        self.terminalViewModel.fromCurrentData(data);
        self.webcamViewModel.fromCurrentData(data);
        self.gcodeViewModel.fromCurrentData(data);
    })

    self.reconnect = function() {
        self._socket.socket.connect();
    }
}

$(function() {

        //~~ View models
        var connectionViewModel = new ConnectionViewModel();
        var printerStateViewModel = new PrinterStateViewModel();
        var temperatureViewModel = new TemperatureViewModel();
        var controlsViewModel = new ControlsViewModel();
        var speedViewModel = new SpeedViewModel();
        var terminalViewModel = new TerminalViewModel();
        var gcodeFilesViewModel = new GcodeFilesViewModel();
        var webcamViewModel = new WebcamViewModel();
        var gcodeViewModel = new GcodeViewModel();
        var dataUpdater = new DataUpdater(connectionViewModel, printerStateViewModel, temperatureViewModel, controlsViewModel, speedViewModel, terminalViewModel, webcamViewModel, gcodeViewModel);

        //~~ Print job control

        $("#job_print").click(function() {
            $.ajax({
                url: AJAX_BASEURL + "control/print",
                type: "POST",
                dataType: "json",
                success: function(){}
            })
        })
        $("#job_pause").click(function() {
            $("#job_pause").button("toggle");
            $.ajax({
                url: AJAX_BASEURL + "control/pause",
                type: "POST",
                dataType: "json"
            })
        })
        $("#job_cancel").click(function() {
            $.ajax({
                url: AJAX_BASEURL + "control/cancel",
                type: "POST",
                dataType: "json"
            })
        })

        //~~ Temperature control

        $("#temp_newTemp_set").click(function() {
            var newTemp = $("#temp_newTemp").val();
            $.ajax({
                url: AJAX_BASEURL + "control/temperature",
                type: "POST",
                dataType: "json",
                data: { temp: newTemp },
                success: function() {$("#temp_newTemp").val("")}
            })
        })
        $("#temp_newBedTemp_set").click(function() {
            var newBedTemp = $("#temp_newBedTemp").val();
            $.ajax({
                url: AJAX_BASEURL + "control/temperature",
                type: "POST",
                dataType: "json",
                data: { bedTemp: newBedTemp },
                success: function() {$("#temp_newBedTemp").val("")}
            })
        })
        $('#tabs a[data-toggle="tab"]').on('shown', function (e) {
            temperatureViewModel.updatePlot();
        });

        //~~ Speed controls

        function speedCommand(structure) {
            var speedSetting = $("#speed_" + structure).val();
            if (speedSetting) {
                $.ajax({
                    url: AJAX_BASEURL + "control/speed",
                    type: "POST",
                    dataType: "json",
                    data: structure + "=" + speedSetting,
                    success: function(response) {
                        $("#speed_" + structure).val("")
                        speedViewModel.fromResponse(response);
                    }
                })
            }
        }
        $("#speed_outerWall_set").click(function() {speedCommand("outerWall")});
        $("#speed_innerWall_set").click(function() {speedCommand("innerWall")});
        $("#speed_support_set").click(function() {speedCommand("support")});
        $("#speed_fill_set").click(function() {speedCommand("fill")});

        //~~ Terminal

        $("#terminal-send").click(function () {
            var command = $("#terminal-command").val();
            if (command) {
                $.ajax({
                    url: AJAX_BASEURL + "control/command",
                    type: "POST",
                    dataType: "json",
                    data: "command=" + command
                })
            }
        })

        //~~ Gcode upload

        $("#gcode_upload").fileupload({
            dataType: "json",
            done: function (e, data) {
                gcodeFilesViewModel.fromResponse(data.result);
            },
            progressall: function (e, data) {
                var progress = parseInt(data.loaded / data.total * 100, 10);
                $("#gcode_upload_progress .bar").css("width", progress + "%");
            }
        });

        //~~ Offline overlay
        $("#offline_overlay_reconnect").click(function() {dataUpdater.reconnect()});

        //~~ knockout.js bindings

        ko.applyBindings(connectionViewModel, document.getElementById("connection"));
        ko.applyBindings(printerStateViewModel, document.getElementById("state"));
        ko.applyBindings(gcodeFilesViewModel, document.getElementById("files"));
        ko.applyBindings(temperatureViewModel, document.getElementById("temp"));
        ko.applyBindings(controlsViewModel, document.getElementById("controls"));
        ko.applyBindings(terminalViewModel, document.getElementById("term"));
        ko.applyBindings(speedViewModel, document.getElementById("speed"));

        var webcamElement = document.getElementById("webcam");
        if (webcamElement) {
            ko.applyBindings(webcamViewModel, document.getElementById("webcam"));
        }
        var gCodeVisualizerElement = document.getElementById("tab2d");
        if(gCodeVisualizerElement){
            gcodeViewModel.initialize();
        }
        //~~ startup commands

        connectionViewModel.requestData();
        controlsViewModel.requestData();
        gcodeFilesViewModel.requestData();
        webcamViewModel.requestData();

    }
);

