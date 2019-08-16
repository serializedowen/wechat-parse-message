const parse = text => {
  return new Promise((resolve, reject) => {
    if (text.includes("，")) {
      let processed = text.split("，");

      let ret = {
        address: undefined,
        tel: undefined,
        name: undefined,
        quantity: undefined,
        spec: undefined,
        unknown: []
      };

      for (let i = 0; i < processed.length; i++) {
        item = processed[i].trim();

        if (
          item.length == 2 ||
          item.length == 3 ||
          (item.length == 4 && item[3] == "收")
        ) {
          ret.name = item;
          continue;
        }

        if (
          item.length > 5 &&
          (item.includes("市") ||
            item.includes("区") ||
            item.includes("市") ||
            item.includes("路") ||
            item.includes("号"))
        ) {
          ret.address = item;
          continue;
        }

        if (item.includes("普通") || item.includes("礼盒")) {
          ret.spec = item.includes("普通") ? "普通" : "礼盒";
          ret.quantity = Number(item[2]);
          continue;
        }

        let telIndex = item.search(/1[3456789]\d{9}/);
        if (telIndex != -1) {
          ret.tel = Number(item.substring(telIndex, telIndex + 11));
        }

        ret.unknown = [...ret.unknown, item];
      }

      resolve(ret);
    } else {
      reject(text);
    }
  });
};

parse(
  "普通2箱，学士路一号浙江大学医学院附属妇产科医院3号楼3楼，陆文悦，13777882549"
).then(console.log);

parse(
  "普通2箱，杭州邮电路54号浙江省中医院门诊2楼针灸科，马泽云13777867967（李秋芳送人）"
).then(console.log);
parse(
  "普通1箱，上海市浦东新区东方路1678号儿童医学中心心脏中心6楼6026护士长办公室（小张），管咏梅，18930830776（小张）"
).then(console.log);

module.exports = parse;
