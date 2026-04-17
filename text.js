const users = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
  { id: 3, name: "Charlie" }
];
const orders = [
  { id: 101, userId: 1, productId: 1001 },
  { id: 102, userId: 1, productId: 1002 },
  { id: 103, userId: 2, productId: 1001 },
  { id: 104, userId: 1, productId: 1001 } // 重复商品
];
const products = [
  { id: 1001, name: "iPhone" },
  { id: 1002, name: "MacBook" }
];

const userMap=new Map(users.map(u=>[u.id,u]))
const productMap=new Map(products.map(p=>[p.id,p]))


const userOrderMap=new Map()

for (const order of orders){
  if(!userOrderMap.has(order.userId)){
    userOrderMap.set(order.userId,[])
  }
  userOrderMap.get(order.userId).push(order)
}

console.log(userOrderMap)