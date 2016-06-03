-- Indexed function
local a = {}
function a.foo()
  print("Hello!");
end
a.foo();
function a:bar()
  print("Hello!", self.s);
end
a.s = "foo"
a:bar();
