var Observ = require("observ")
var extend = require("xtend")

/* ObservHash := (Object<String, Observ<T>>) => 
    Object<String, Observ<T>> &
        Observ<Object<String, T> & {
            _diff: Object<String, Any>
        }>

*/
module.exports = ObservHash

function ObservHash(hash) {
    var keys = Object.keys(hash)

    var initialState = {}

    keys.forEach(function (key) {
        var observ = hash[key]
        initialState[key] = typeof observ === "function" ?
            observ() : observ
    })

    var obs = Observ(initialState)
    keys.forEach(function (key) {
        var observ = hash[key]
        obs[key] = observ

        if (typeof observ === "function") {
            observ(function (value) {
                var state = extend(obs())
                state[key] = value
                var diff = {}
                diff[key] = value && value._diff ?
                    value._diff : value
                state._diff = diff
                obs.set(state)
            })
        }
    })

    return obs
}
