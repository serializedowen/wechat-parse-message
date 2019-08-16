#!/usr/bin/env node
const date = new Date();

const errorCSV = "errors.csv";
const fileName =
  date.getFullYear().toString() +
  "-" +
  date.getMonth() +
  "-" +
  date.getDate() +
  ".csv";

const Promise = require("bluebird");
const qrTerm = require("qrcode-terminal");
const fs = require("fs");
const parseOrder = require("./parser");

const { config, Contact, Room, Wechaty, log } = require("wechaty");
const appendFile = Promise.promisify(fs.appendFile);

/**
 *   Wechaty - https://github.com/chatie/wechaty
 *
 *   @copyright 2016-2018 Huan LI <zixia@zixia.net>
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *
 */

/**
 *
 * Known ISSUES:
 *  - BUG1: can't find member by this NickName:
 *    ' leaver: 艾静<img class="emoji emojiae" text="_web" src="/zh_CN/htmledition/v2/images/spacer.gif" />JOY
 *  - BUG2: leave event not right: sometimes can not found member (any more, because they left)
 * create a room need at least three people
 * when we create a room, the following one is the 3rd people.
 *
 * put name of one of your friend here, or room create function will not work.
 *
 * ::::::::: ___CHANGE ME___ :::::::::
 *                           vvvvvvvvv
 *                           vvvvvvvvv
 *                           vvvvvvvvv
 */

/**
 *                           ^^^^^^^^^
 *                           ^^^^^^^^^
 *                           ^^^^^^^^^
 * ::::::::: ___CHANGE ME___ :::::::::
 *
 */

/* tslint:disable:variable-name */

const welcome = `
=============== Powered by Wechaty ===============
-------- https://github.com/Chatie/wechaty --------

Hello,

I'm a Wechaty Botie with the following super powers:

1. Find a room
2. Add people to room
3. Del people from room
4. Change room topic
5. Monitor room events
6. etc...

If you send a message of magic word 'ding',
you will get a invitation to join my own room!
__________________________________________________

Hope you like it, and you are very welcome to
upgrade me for more super powers!

Please wait... I'm trying to login in...

`;
console.log(welcome);
const bot = Wechaty.instance({ profile: config.default.DEFAULT_PROFILE });

bot
  .on("scan", (qrcode, status) => {
    qrTerm.generate(qrcode, { small: true });
    console.log(`${qrcode}\n[${status}] Scan QR Code in above url to login: `);
  })
  .on("logout", user => log.info("Bot", `"${user.name()}" logouted`))
  .on("error", e => log.info("Bot", "error: %s", e))

  /**
   * Global Event: login
   *
   * do initialization inside this event.
   * (better to set a timeout, for browser need time to download other data)
   */
  .on("login", async function(user) {
    let msg = `${user.name()} logined`;

    log.info("Bot", msg);
    await this.say(msg);
  })

  /**
   * Global Event: room-join
   */
  .on("room-join", async function(room, inviteeList, inviter) {
    log.info(
      "Bot",
      'EVENT: room-join - Room "%s" got new member "%s", invited by "%s"',
      await room.topic(),
      inviteeList.map(c => c.name()).join(","),
      inviter.name()
    );
    console.log("bot room-join room id:", room.id);
    const topic = await room.topic();
    await room.say(`welcome to "${topic}"!`, inviteeList[0]);
  })

  /**
   * Global Event: room-leave
   */
  .on("room-leave", async function(room, leaverList) {
    log.info(
      "Bot",
      'EVENT: room-leave - Room "%s" lost member "%s"',
      await room.topic(),
      leaverList.map(c => c.name()).join(",")
    );
    const topic = await room.topic();
    const name = leaverList[0] ? leaverList[0].name() : "no contact!";
    await room.say(`kick off "${name}" from "${topic}"!`);
  })

  /**
   * Global Event: room-topic
   */
  .on("room-topic", async function(room, topic, oldTopic, changer) {
    try {
      log.info(
        "Bot",
        'EVENT: room-topic - Room "%s" change topic from "%s" to "%s" by member "%s"',
        room,
        oldTopic,
        topic,
        changer
      );
      await room.say(
        `room-topic - change topic from "${oldTopic}" to "${topic}" by member "${changer.name()}"`
      );
    } catch (e) {
      log.error("Bot", "room-topic event exception: %s", e.stack);
    }
  })

  /**
   * Global Event: message
   */
  .on("message", async function(msg) {
    if (msg.age() > 3 * 60) {
      log.info(
        "Bot",
        'on(message) skip age("%d") > 3 * 60 seconds: "%s"',
        msg.age(),
        msg
      );
      return;
    }

    const room = msg.room();
    const from = msg.from();
    const text = msg.text();

    if (room) {
      let topic = await room.topic();
      if (topic == "黄桃订单写这边") {
        parseOrder(text)
          .then(order =>
            [
              order.name,
              order.address,
              order.tel,
              order.quantity,
              order.spec,
              order.unknown
            ]
              .join(",")
              .concat("\n")
          )
          .then(parsed => appendFile(fileName, parsed))
          .catch(err => {
            console.log("写入错误");
            appendFile(errorCSV, text);
          });

        // return fs.appendFile(fileName, text, err => {
        //   if (!err) {
        //     console.log("写入一条数据".green + text);
        //   } else {
        //     console.error("写入错误");
        //     fs.appendFileSync(errorCSV, text);
        //   }
        // });
      }
    }
    if (!from) {
      return;
    }

    console.log(
      (room ? "[" + (await room.topic()) + "]" : "") +
        "<" +
        from.name() +
        ">" +
        ":" +
        msg
    );
  })
  .start()
  .catch(e => console.error(e));
