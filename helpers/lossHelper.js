const lFn = [
    (results) => {
        let t = 0
        for (let i = 0; i < results.length; i++) {
            let r = 0
            for (let j = 0; j < results[i][0].length; j++) {
                const diff = (results[i][0][j] - results[i][1][j])
                r += Math.pow(diff, 2)
            }
            r /= results[i][0].length
            t += r
        }
        return t / results.length
    }
]

const lNm = {
    mse: 0
}

module.exports = { lNm, lFn }