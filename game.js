
const ENTITY_SIZE = 60,
    ENEMY_AMOUNT = 1,
    RESOURCE_AMOUNT = 2,
    RESOURCE_EXPIRE = 15 * 1000,
    BOARD_SIZE_X = 240,
    BOARD_SIZE_Y = 240,
    MAX_VISION = ENTITY_SIZE * 2;

let playerX = Math.ceil(0 / ENTITY_SIZE) * ENTITY_SIZE,
    playerY = Math.ceil(0 / ENTITY_SIZE) * ENTITY_SIZE,
    enemiesEncountered = 0,
    resourcesGathered = 0,
    resources = [],
    enemies = [];

function reset() {
    playerX = Math.ceil(0 / ENTITY_SIZE) * ENTITY_SIZE;
    playerY = Math.ceil(0 / ENTITY_SIZE) * ENTITY_SIZE;

    enemies = [];
    resources = [];

    enemiesEncountered = 0;
    resourcesGathered = 0;

    for (let i = 0; i < ENEMY_AMOUNT; i++) {
        enemies.push(generateEntity());
    }
    for (let i = 0; i < RESOURCE_AMOUNT; i++) {
        resources.push(generateEntity());
    }
}

function entityCollides(entity) {
    let entityCollides = true;

    resources.forEach(resource => {
        if (resource.x === entity.x && resource.y === entity.y) {
            entityCollides = false;
        }
    });

    enemies.forEach(enemy => {
        if (enemy.x === entity.x && enemy.y === entity.y) {
            entityCollides = false;
        }
    });

    return entityCollides;
}

function generateEntityCoords() {
    const x = Math.floor(Math.random() * BOARD_SIZE_X) + 1;
    const y = Math.floor(Math.random() * BOARD_SIZE_Y) + 1;

    return { x: Math.ceil(x / ENTITY_SIZE) * ENTITY_SIZE - ENTITY_SIZE, y: Math.ceil(y / ENTITY_SIZE) * ENTITY_SIZE - ENTITY_SIZE, time: new Date().getTime() };
}

function generateEntity() {
    let entityIsValid = false;
    let entity = generateEntityCoords();

    while (!entityIsValid) {
        entityIsValid = entityCollides(entity);

        if (!entityIsValid) {
            entity = generateEntityCoords(entity);
        }
    }

    return entity;
}

function update(code) {
    let encounteredEnemy = false;
    let encounteredResource = false;

    switch (code) {
        case 'left':
            if (playerX > 0) {
                playerX -= ENTITY_SIZE;
            }
            break;
        case 'right':
            if (playerX + ENTITY_SIZE < BOARD_SIZE_X) {
                playerX += ENTITY_SIZE;
            }
            break;
        case 'up':
            if (playerY > 0) {
                playerY -= ENTITY_SIZE;
            }
            break;
        case 'down':
            if (playerY + ENTITY_SIZE < BOARD_SIZE_Y) {
                playerY += ENTITY_SIZE;
            }
            break;
    }

    resources = resources.map(resource => {
        if (playerX < resource.x + ENTITY_SIZE / 2 && playerX + ENTITY_SIZE / 2 > resource.x && playerY < resource.y + ENTITY_SIZE / 2 && playerY + ENTITY_SIZE / 2 > resource.y) {
            resourcesGathered += 1;
            encounteredResource = true;
            return generateEntity();
        }
        else if ((new Date().getTime()) - resource.time > RESOURCE_EXPIRE) {
            return generateEntity();;
        }
        else {
            return resource;
        }
    });

    enemies = enemies.map(enemy => {
        if (playerX < enemy.x + ENTITY_SIZE / 2 && playerX + ENTITY_SIZE / 2 > enemy.x && playerY < enemy.y + ENTITY_SIZE / 2 && playerY + ENTITY_SIZE / 2 > enemy.y) {
            enemiesEncountered += 1;
            encounteredEnemy = true;
            return generateEntity();
        }
        else if ((new Date().getTime()) - enemy.time > RESOURCE_EXPIRE) {
            return generateEntity();;
        }
        else {
            return enemy
        }
    });

    if (encounteredEnemy) {
        return -1;
    }
    else if (encounteredResource) {
        return 1;
    }
    else {
        return 0;
    }
};

function getPlayerCoords() {
    return {
        x: playerX,
        y: playerY
    };
}

function getResourceCoords() {
    return resources;
}

function getEnemyCoords() {
    return enemies;
}

function getPoints() {
    return { enemiesEncountered, resourcesGathered };
}

function normalizeAgainstMaxVision(value) {
    const nonNegativeValue = Math.abs(value);
    if (nonNegativeValue > MAX_VISION) {
        return 1;
    }
    else {
        return nonNegativeValue / MAX_VISION;
    }
}

function getIntersectDistance(x, y, distanceX, distanceY, coordItems) {
    let closestItemDistance = MAX_VISION;

    for (let i = 0; i < coordItems.length; i++) {
        const item = coordItems[i];
        if (distanceX === 0) {
            if (item.x === x && (distanceY > 0 && item.y > y || distanceY < 0 && item.y < y)) {
                closestItemDistance = Math.abs(item.y - y) - ENTITY_SIZE < closestItemDistance ? Math.abs(item.y - y) - ENTITY_SIZE : closestItemDistance;
            }
        }
        else if (distanceY === 0) {
            if (item.y === y && (distanceX > 0 && item.x > x || distanceX < 0 && item.x < x)) {
                closestItemDistance = Math.abs(item.x - x) - ENTITY_SIZE < closestItemDistance ? Math.abs(item.x - x) - ENTITY_SIZE : closestItemDistance;
            }
        }
    }

    return closestItemDistance;
}

function getIntersectDistanceResources(x, y, distanceX, distanceY) {
    return getIntersectDistance(x, y, distanceX, distanceY, resources);
}

function getIntersectDistanceEnemies(x, y, distanceX, distanceY) {
    return getIntersectDistance(x, y, distanceX, distanceY, enemies);
}


function getSensors() {
    let upWall = normalizeAgainstMaxVision(playerY);
    let downWall = normalizeAgainstMaxVision(BOARD_SIZE_Y - playerY - ENTITY_SIZE);
    let leftWall = normalizeAgainstMaxVision(playerX);
    let rightWall = normalizeAgainstMaxVision(BOARD_SIZE_X - playerX - ENTITY_SIZE);

    let upEnemy = normalizeAgainstMaxVision(getIntersectDistanceEnemies(playerX, playerY, 0, -MAX_VISION));
    let upResource = normalizeAgainstMaxVision(getIntersectDistanceResources(playerX, playerY, 0, -MAX_VISION));

    upEnemy = upEnemy > upResource ? 1 : upEnemy;
    upResource = upResource > upEnemy ? 1 : upResource;
    upWall = upEnemy < 1 || upResource < 1 ? 1 : upWall;

    let downEnemy = normalizeAgainstMaxVision(getIntersectDistanceEnemies(playerX, playerY, 0, MAX_VISION));
    let downResource = normalizeAgainstMaxVision(getIntersectDistanceResources(playerX, playerY, 0, MAX_VISION));

    downEnemy = downEnemy > downResource ? 1 : downEnemy;
    downResource = downResource > downEnemy ? 1 : downResource;
    downWall = downEnemy < 1 || downResource < 1 ? 1 : downWall;

    let leftEnemy = normalizeAgainstMaxVision(getIntersectDistanceEnemies(playerX, playerY, -MAX_VISION, 0));
    let leftResource = normalizeAgainstMaxVision(getIntersectDistanceResources(playerX, playerY, -MAX_VISION, 0));

    leftEnemy = leftEnemy > leftResource ? 1 : leftEnemy;
    leftResource = leftResource > leftEnemy ? 1 : leftResource;
    leftWall = leftEnemy < 1 || leftResource < 1 ? 1 : leftWall;

    let rightEnemy = normalizeAgainstMaxVision(getIntersectDistanceEnemies(playerX, playerY, MAX_VISION, 0));
    let rightResource = normalizeAgainstMaxVision(getIntersectDistanceResources(playerX, playerY, MAX_VISION, 0));

    rightEnemy = rightEnemy > rightResource ? 1 : rightEnemy;
    rightResource = rightResource > rightEnemy ? 1 : rightResource;
    rightWall = rightEnemy < 1 || rightResource < 1 ? 1 : rightWall;

    const sensors = [upWall, downWall, leftWall, rightWall, upEnemy, downEnemy, leftEnemy, rightEnemy, upResource, downResource, leftResource, rightResource];
    return sensors;
}

export default {
    reset,
    update,
    getPoints,
    getPlayerCoords,
    getEnemyCoords,
    getResourceCoords,
    getSensors
}