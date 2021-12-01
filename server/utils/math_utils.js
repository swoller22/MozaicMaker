const myMathHelper = {
    
    getAverage: (array) => {

        var total = 0
        for(var i = 0; i<array.length; i++) {
            total += array[i]
        }
    
        return total/array.length
    },

    getWorstMatchDistance: (array) => {

        return Math.max(...array)
    }
}

export {myMathHelper}