const { randomInt } = require('./mathHelper')

const getRandomElement = arr => {
    return arr[randomInt(0, arr.length - 1)]
}

const normalizeArray = arr => {
    const t = arr.reduce((acc, v) => acc + v, 0)
    if (t == 0) return arr.slice(0)
    return arr.slice(0).map(v => v / t)
}

const rouletteSelectClientArray = arr => {
    arr.sort((a, b) => a.score - b.score)
    const t = arr.reduce((acc, c) => acc + c.score, 0)
    const r = Math.random() * t
    let score = 0
    for (let i = 0; i < arr.length; i++) {
        if (r < (arr[i].score + score)) return arr[i]
        score += arr[i].score
    }
    return arr[arr.length - 1]
}



module.exports = { rouletteSelectClientArray, normalizeArray, getRandomElement }