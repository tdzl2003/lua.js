local b = 1

repeat
  local a = 1
  b = b + 1
  if (b == 3) then
      break
  end
until a==1
-- should be 2.
print(b);
