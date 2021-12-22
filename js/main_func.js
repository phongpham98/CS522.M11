var codetraceColor = 'white';
var isPlaying = false;
var isPaused = false;

function highlightLine(lineNumbers) {
    $('#codetrace p').css('background-color', "rgb(255 255 255 / 0%)").css('color', codetraceColor);
    if (lineNumbers instanceof Array) {
        for (var i = 0; i < lineNumbers.length; i++)
            if (lineNumbers[i] != 0)
                $('#code' + lineNumbers[i]).css({ 'background-color': 'rgb(42 96 65 / 88%)', 'color': 'rgb(255 252 49)', 'font-weight': 'bold' });
    } else
        $('#code' + lineNumbers).css({ 'background-color': 'rgb(42 96 65 / 88%)', 'color': 'rgb(255 252 49)', 'font-weight': 'bold' });
}
$(function () {
    $("#speedSort").on("change", function (e) {
        let speed = parseInt(e.target.value);
        gw.setAnimationDuration(3200 - speed);
    })
});

function isAtEnd() {
    return (gw.getCurrentIteration() == (gw.getTotalIteration() - 1));
}

function pause() {
    if (isPlaying) {
        isPaused = true;
        gw.pause();
        $('#play img').attr('src', './image/Play.png').attr('title', 'play');
        $('#play').show();
        $('#pause').hide();
    }
}

function play() {
    if (isPlaying) {
        isPaused = false;
        $('#pause').show();
        $('#play').hide();
        if (isAtEnd())
            gw.replay();
        else
            gw.play();
    }
}

function stepForward() {
    if (isPlaying) {
        pause();
        gw.forceNext(250);
    }
}

function stepBackward() {
    if (isPlaying) {
        pause();
        gw.forcePrevious(250);
    }
}

function goToBeginning() {
    if (isPlaying) {
        gw.jumpToIteration(0, 0);
        pause();
    }
}

function goToEnd() {
    if (isPlaying) {
        gw.jumpToIteration(gw.getTotalIteration() - 1, 0);
        pause();
    }
}

function stop() {
    try { gw.stop(); } catch (err) { }
    isPaused = false;
    isPlaying = false;
    $('#pause').show();
    $('#play').hide();
}