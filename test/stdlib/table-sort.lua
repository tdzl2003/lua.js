local list = { 3, 2, 54, 2, 51 }
table.sort(list, function(a, b)
    return a < b
end)
print(table.unpack(list))
