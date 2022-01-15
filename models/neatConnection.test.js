const Connection = require("./neatConnection")

describe('neatConnection', () => {
    describe('ctor', () => {
        const newConnectionTestData = [
            [
                [0, 1, 0.1, 0]
            ],
            [
                [1, 4, 0.0001, 11, true]
            ],
            [
                [1, 4, 0.0001, 11, true, false]
            ],
            [
                [2, 6, -0.15, 123, false, true]
            ],
            [
                [3, 11, 1.1, 456789, true, true]
            ],
        ]
        test.each(newConnectionTestData)('should return new Connection with expected props', (args) => {
            console.log(args)
            const recurrent = args.length > 4 ? args[4] : false
            const enabled = args.length > 5 ? args[5] : true
            let con = new Connection(...args)
            expect(con.inNode).toBe(args[0])
            expect(con.outNode).toBe(args[1])
            expect(con.weight).toBe(args[2])
            expect(con.innov).toBe(args[3])
            expect(con.recurrent).toBe(recurrent)
            expect(con.enabled).toBe(enabled)
        })
    })
})