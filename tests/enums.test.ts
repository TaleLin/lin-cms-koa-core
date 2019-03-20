import { UserActive, UserAdmin } from "../lib/enums";

test("测试UserSuper", () => {
  expect(UserAdmin.COMMON).toBe(1);
  expect(UserAdmin.ADMIN).toBe(2);
});

test("测试UserActive", () => {
  expect(UserActive.ACTIVE).toBe(1);
  expect(UserActive.NOT_ACTIVE).toBe(2);
});
