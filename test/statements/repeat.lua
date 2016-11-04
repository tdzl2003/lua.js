function aaa()
  print '1'
    c = true
    repeat
      print '2'
      if c == true then
        print '3'
        break
      end
      print '4'
    until c ~= false
    print '5'
end

aaa()
