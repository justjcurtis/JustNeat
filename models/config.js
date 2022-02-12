const hyper = {
    c1: 1,
    c2: 1,
    c3: 0.4,
    weightShiftStrength: 0.05,
    biasShiftStrength: 0.05,
    threshold: 10,
    speciesTarget: 50,
    initialMutation: 1,
    cullRate: 0.5,
    minWeight: -100,
    maxWeight: 100,
    minBias: -100,
    maxBias: 100,
    elitism: 0.01,
    dropoff: 15,
    dropRate: 0,
    cloneRate: 0.25,
    complexityThreshold: 30,
    complexityFloorDelay: 10,
    fitnessPlatauThreshold: 10,
    connectionCost: 0.1,
    nodeCost: 0.2

}

const probs = {
    weightMutationChance: 0.8,
    weightShiftChance: 0.9,
    biasMutationChance: 0.8,
    biasShiftChance: 0.9,
    addConnectionChance: 0.05,
    addRecurrentChance: 0.5,
    reEnableConnectionChance: 0.25,
    disableConnectionChance: 0.05,
    addNodeChance: 0.025,
    deleteConnectionChance: 0.05,
    deleteNodeChance: 0.025,
    randomActivationChance: 0.05,
}

const opts = {
    maxPop: 1000,
    recurrent: false,
    outputActivation: 'tanh',
    hiddenActivation: 'tanh',
    allowedActivations: [
        'id',
        'sig',
        'tanh',
        'relu',
        'bin',
        'gelu',
        'softPlus',
        'invert',
        'softSign',
        'bipolSig',
    ],
    lossFn: 'mse',
    hyper: {},
    probs: {}
}

module.exports = { opts, probs, hyper }