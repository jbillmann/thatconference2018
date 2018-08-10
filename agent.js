import { Model, NeuralNetwork, Academy } from 'reimprovejs/dist/reimprove.js';

const modelFitConfig = {
    epochs: 10,
    stepsPerEpoch: 100
};

const numActions = 4;
const inputSize = 12;
const temporalWindow = 1;
const totalInputSize = inputSize * temporalWindow + numActions * temporalWindow + inputSize;

const teacherConfig = {
    lessonsQuantity: 500,
    lessonLength: 1000,
    lessonsWithRandom: 2,
    epsilon: 1,
    epsilonDecay: 0.99,
    epsilonMin: 0.01,
    gamma: 0.001
};

let academy = null,
    teacher = null,
    agent = null;

function createAgent() {
    const network = new NeuralNetwork();
    
    network.InputShape = [totalInputSize];
    network.addNeuralNetworkLayers([
        {type: 'dense', units: 64, activation: 'relu'},
        {type: 'dense', units: numActions, activation: 'softmax'}
    ]);
    
    const model = new Model.FromNetwork(network, modelFitConfig);
    
    model.compile({loss: 'meanSquaredError', optimizer: 'sgd'})

    const agentConfig = {
        model: model,
        agentConfig: {
            memorySize: 100000,
            batchSize: 64,
            temporalWindow: temporalWindow
        }
    };
    
    academy = new Academy();
    teacher = academy.addTeacher(teacherConfig);
    agent = academy.addAgent(agentConfig);
    
    academy.assignTeacherToAgent(agent, teacher);
};

function train(reward) {
    academy.addRewardToAgent(agent, reward)
}

function isTraining() {
    return academy.teachers.get(teacher).state !== 2;
}

function trainingLesson() {
    return academy.teachers.get(teacher).lessonsTaught;
}

async function step(inputs) {
    return await academy.step([{ teacherName: teacher, agentsInput: inputs} ]);
}

export default {
    createAgent,
    train,
    isTraining,
    trainingLesson,
    step
}