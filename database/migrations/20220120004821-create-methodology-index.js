"use strict";

const { DataType } = require("sequelize-typescript")

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    await queryInterface.createTable("methodology_indices", {
      timestamp: {
        allowNull: false,
        type: Sequelize.DATE
      },
      value: {
        allowNull: false,
        type: Sequelize.DECIMAL
      },
      methodology: {
        allowNull: false,
        type: Sequelize.ENUM("mfiv")
      },
      symbolType: {
        allowNull: false,
        type: Sequelize.ENUM("option", "perpetual", "future", "spot")
      },
      baseCurrency: {
        allowNull: false,
        type: Sequelize.ENUM("ETH", "BTC")
      },
      exchange: {
        allowNull: false,
        type: Sequelize.ENUM("bitmex", "deribit", "binance-futures", "binance-delivery", "binance-options", "binance", "ftx", "okex-futures", "okex-options", "okex-swap", "okex", "huobi-dm", "huobi-dm-swap", "huobi-dm-linear-swap", "huobi", "bitfinex-derivatives", "bitfinex", "coinbase", "cryptofacilities", "kraken", "bitstamp", "gemini", "poloniex", "bybit", "phemex", "delta", "ftx-us", "binance-us", "gate-io-futures", "gate-io", "okcoin", "bitflyer", "hitbtc", "coinflex", "binance-jersey", "binance-dex", "upbit", "ascendex", "dydx", "serum", "huobi-dm-options", "star-atlas")
      },
      interval: {
        allowNull: false,
        type: Sequelize.ENUM("1d", "2d", "3d", "4d", "5d", "6d", "7d", "8d", "9d", "10d", "11d", "12d", "13d", "14d", "15d", "16d", "17d", "18d", "19d", "20d", "21d", "22d", "23d", "24d", "25d", "26d", "27d", "28d", "29d", "30d", "31d", "32d", "33d", "34d", "35d", "36d", "37d", "38d", "39d", "40d", "41d", "42d", "43d", "44d", "45d", "46d", "47d", "48d", "49d", "50d", "51d", "52d", "53d", "54d", "55d", "56d", "57d", "58d", "59d", "60d", "61d", "62d", "63d", "64d", "65d", "66d", "67d", "68d", "69d", "70d", "71d", "72d", "73d", "74d", "75d", "76d", "77d", "78d", "79d", "80d", "81d", "82d", "83d", "84d", "85d", "86d", "87d", "88d", "89d", "90d", "91d", "92d", "93d", "94d", "95d", "96d", "97d", "98d", "99d", "100d", "101d", "102d", "103d", "104d", "105d", "106d", "107d", "108d", "109d", "110d", "111d", "112d", "113d", "114d", "115d", "116d", "117d", "118d", "119d", "120d", "121d", "122d", "123d", "124d", "125d", "126d", "127d", "128d", "129d", "130d", "131d", "132d", "133d", "134d", "135d", "136d", "137d", "138d", "139d", "140d", "141d", "142d", "143d", "144d", "145d", "146d", "147d", "148d", "149d", "150d", "151d", "152d", "153d", "154d", "155d", "156d", "157d", "158d", "159d", "160d", "161d", "162d", "163d", "164d", "165d", "166d", "167d", "168d", "169d", "170d", "171d", "172d", "173d", "174d", "175d", "176d", "177d", "178d", "179d", "180d", "181d", "182d", "183d", "184d", "185d", "186d", "187d", "188d", "189d", "190d", "191d", "192d", "193d", "194d", "195d", "196d", "197d", "198d", "199d", "200d", "201d", "202d", "203d", "204d", "205d", "206d", "207d", "208d", "209d", "210d", "211d", "212d", "213d", "214d", "215d", "216d", "217d", "218d", "219d", "220d", "221d", "222d", "223d", "224d", "225d", "226d", "227d", "228d", "229d", "230d", "231d", "232d", "233d", "234d", "235d", "236d", "237d", "238d", "239d", "240d", "241d", "242d", "243d", "244d", "245d", "246d", "247d", "248d", "249d", "250d", "251d", "252d", "253d", "254d", "255d", "256d", "257d", "258d", "259d", "260d", "261d", "262d", "263d", "264d", "265d", "266d", "267d", "268d", "269d", "270d", "271d", "272d", "273d", "274d", "275d", "276d", "277d", "278d", "279d", "280d", "281d", "282d", "283d", "284d", "285d", "286d", "287d", "288d", "289d", "290d", "291d", "292d", "293d", "294d", "295d", "296d", "297d", "298d", "299d", "300d", "301d", "302d", "303d", "304d", "305d", "306d", "307d", "308d", "309d", "310d", "311d", "312d", "313d", "314d", "315d", "316d", "317d", "318d", "319d", "320d", "321d", "322d", "323d", "324d", "325d", "326d", "327d", "328d", "329d", "330d", "331d", "332d", "333d", "334d", "335d", "336d", "337d", "338d", "339d", "340d", "341d", "342d", "343d", "344d", "345d", "346d", "347d", "348d", "349d", "350d", "351d", "352d", "353d", "354d", "355d", "356d", "357d", "358d", "359d", "360d", "361d", "362d", "363d", "364d")
      },
      extra: {
        allowNull: true,
        type: Sequelize.JSONB
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        default: Sequelize.NOW
      },
    }).then(async () => {
      await queryInterface.addIndex("methodology_indices", ["timestamp"], { fields: ["timestamp"], order: "ASC" })
      await queryInterface.addIndex("methodology_indices", ["exchange", "baseCurrency", "symbolType", "methodology"], { fields: ["exchange", "baseCurrency", "symbolType", "methodology"], attribute: "timestamp", order: "ASC" })
      await transaction.commit();
    }).catch(async reason => {
      console.error(reason)
      await transaction.rollback();
    })

  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("methodology_indices");
  }
};
