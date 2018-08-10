import game from './game';
import Agent from './agent';

const canvas = document.getElementById('canvas'),
    cw = canvas.width,
    ch = canvas.height;

let ctx = null,
    currentLesson = -1,
    currentLessonStartEnemies = 0,
    currentLessonStartResources = 0,
    lessonAccuracy = [],
    startTime = new Date().getTime(),
    currentTime = new Date().getTime();

function gameLoop() {
    window.requestAnimationFrame(gameLoop);
    currentTime = new Date().getTime();

    ctx.clearRect(0, 0, cw, ch);

    ctx.fillStyle = "green";
    const resources = game.getResourceCoords();
    resources.forEach(resource => {
        ctx.fillRect(resource.x, resource.y, 60, 60);
    });

    ctx.fillStyle = "red";
    const enemies = game.getEnemyCoords();
    enemies.forEach(enemies => {
        ctx.fillRect(enemies.x, enemies.y, 60, 60);
    });

    ctx.fillStyle = "white";
    const playerCoords = game.getPlayerCoords();
    ctx.fillRect(playerCoords.x, playerCoords.y, 60, 60);

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, cw, ch);

    update();

    const gamePoints = game.getPoints();
    let accuracy = 0;

    if (currentLesson !== Agent.trainingLesson()) {
        currentLesson = Agent.trainingLesson();
        lessonAccuracy.push({ enemiesEncountered: 0, resourcesGathered: 0 });
        currentLessonStartEnemies = gamePoints.enemiesEncountered;
        currentLessonStartResources = gamePoints.resourcesGathered;
    }

    lessonAccuracy[currentLesson].enemiesEncountered = gamePoints.enemiesEncountered- currentLessonStartEnemies;
    lessonAccuracy[currentLesson].resourcesGathered = gamePoints.resourcesGathered - currentLessonStartResources;

    if (!Agent.isTraining()) {
        document.getElementById('training').innerHTML = "Training Complete";
        document.getElementById('lesson').innerHTML = "";
        accuracy = lessonAccuracy[currentLesson].resourcesGathered / (lessonAccuracy[currentLesson].enemiesEncountered + lessonAccuracy[currentLesson].resourcesGathered) * 100
    }
    else {
        document.getElementById('training').innerHTML = "Training in Progress";
        document.getElementById('lesson').innerHTML = `Lesson: ${ Agent.trainingLesson() }`;
        let rollingEnemies = 0;
        let rollingResources = 0;

        for (let i = lessonAccuracy.length - 1; i >= 0 && i >= lessonAccuracy.length - 5; i--) {
            rollingEnemies += lessonAccuracy[i].enemiesEncountered;
            rollingResources += lessonAccuracy[i].resourcesGathered;
        }

        accuracy = rollingResources / (rollingResources + rollingEnemies) * 100
    }

    document.getElementById('accuracy').innerHTML = `Accuracy: ${ Math.round(accuracy) }%`;
    document.getElementById('startTime').innerHTML = `Time Since Start: ${millisToMinutesAndSeconds(currentTime - startTime)}`;
}

function update() {
    Agent.step(game.getSensors()).then(result => {
        let reward = 0;

        result.forEach(r => {
            if (r === 0) {
                reward = game.update('up');
            }
            else if (r === 1){
                reward = game.update('down');
            }
            else if (r === 2) {
                reward = game.update('left');
            }
            else if (r === 3) {
                reward = game.update('right');
            }

            if (reward !== 0) {
                Agent.train(reward);
            }
        });
    });
}

function millisToMinutesAndSeconds(millis) {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

export default function main() {
    ctx = canvas.getContext('2d');
    Agent.createAgent();
    game.reset();
    gameLoop();
}