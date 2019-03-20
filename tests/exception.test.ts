import { HttpException, ParametersException, Success } from "../lib/exception";

test("测试HttpException基类", () => {
  const ex = new HttpException();
  expect(ex.code).toBe(500);
  expect(ex.errorCode).toBe(999);
});

test("测试ParametersException", () => {
  const ex = new ParametersException();
  expect(ex.code).toBe(400);
  expect(ex.errorCode).toBe(10030);
  expect(ex.msg).toBe("参数错误");
});

test("测试Success", () => {
  const ex = new Success();
  expect(ex.code).toBe(201);
  expect(ex.errorCode).toBe(0);
  expect(ex.msg).toBe("成功");
});
