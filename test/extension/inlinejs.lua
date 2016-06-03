-- Inline Javascript

local log =
    __javascript "console.log"

log("Lua string")

log(__js "1+2")

log(__js("3+" .."4"))
