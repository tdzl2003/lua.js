-- require a library and verify some value
test = require './example'
assert(test == 1)

-- should add the exported variable to current context
assert(abc == 1)
