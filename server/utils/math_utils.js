/**
 * Utility object for basic math operations
 */
const myMathHelper = {
    
    /**
     * Utility to get average of array values
     * 
     * @param array 
     * @returns     Average of array 
     */
    getAverage: (array) => {

        var total = 0
        for(var i = 0; i<array.length; i++) {
            total += array[i]
        }
    
        return total/array.length
    },

    /**
     * Utlity to get maximum value of array
     * 
     * @param array 
     * @returns     Worst distance (maximum) 
     */
    getWorstMatchDistance: (array) => {

        return Math.max(...array)
    }
}

export {myMathHelper}