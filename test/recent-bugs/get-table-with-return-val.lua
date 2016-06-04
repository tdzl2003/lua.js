local a = {
    table = {
        [1] = 5,
    },
};
function a:c()
    return __js[[1]]
end
function a:b()
    print(self.table[a:c()])
end

a:b();
