

import {SQLStatement, dumpTable, SQLResult, SKSQL, numericLoad, writeStringToUtf8ByteArray, readTableAsJSON} from "sksql";
import {checkNoTempTables, runTest} from "./runTest";
import * as assert from "assert";


export function strings(db: SKSQL, next: ()=>void) {
    console.log("TESTING STRINGS...");

    runTest(db, "SELECT 'Hello' FROM dual", false, false, [["Hello"]]);
    runTest(db, "SELECT 'Hello' + ' World' FROM dual", false, false, [["Hello World"]]);
    runTest(db, "SELECT LEN('Hello') FROM dual", false, false, [[5]]);
    runTest(db, "SELECT 'Hello' + 10 FROM dual", false, false, [["Hello10"]]);
    runTest(db, "SELECT 'Hello' + true FROM dual", false, false, [["HelloTRUE"]], undefined, {printDebug: false});
    runTest(db, "SELECT 'aàáäâñeèéêÇç' FROM dual", false, false, [["aàáäâñeèéêÇç"]]);
    runTest(db, "SELECT LEN('aàáäâñeèéêÇç') FROM dual", false, false, [[12]]);
    runTest(db, "SELECT 'Quizdeltagerne spiste jordbær med fløde, mens cirkusklovnen\n" +
        "  Wolther spillede på xylofon.' FROM dual", false, false,
    [["Quizdeltagerne spiste jordbær med fløde, mens cirkusklovnen\n" +
    "  Wolther spillede på xylofon."]]);
    runTest(db, "SELECT 'Falsches Üben von Xylophonmusik quält jeden größeren Zwerg' FROM dual", false, false, [
        ["Falsches Üben von Xylophonmusik quält jeden größeren Zwerg"]
    ]);
    runTest(db, "SELECT 'Γαζέες καὶ μυρτιὲς δὲν θὰ βρῶ πιὰ στὸ χρυσαφὶ ξέφωτο' FROM dual", false, false, [
        ["Γαζέες καὶ μυρτιὲς δὲν θὰ βρῶ πιὰ στὸ χρυσαφὶ ξέφωτο"]
    ]);
    runTest(db, "SELECT 'El pingüino Wenceslao hizo kilómetros bajo exhaustiva lluvia y \n" +
        "  frío, añoraba a su querido cachorro.' FROM dual", false, false, [
            ["El pingüino Wenceslao hizo kilómetros bajo exhaustiva lluvia y \n" +
            "  frío, añoraba a su querido cachorro."]
    ]);
    runTest(db, "SELECT 'Árvíztűrő tükörfúrógép' FROM dual", false, false, [
        ["Árvíztűrő tükörfúrógép"]
    ]);
    runTest(db, "SELECT 'Kæmi ný öxi hér ykist þjófum nú bæði víl og ádrepa' FROM dual", false, false, [
        ["Kæmi ný öxi hér ykist þjófum nú bæði víl og ádrepa"]
    ]);
    runTest(db, "SELECT 'いろはにほへとちりぬるを\n" +
        "  わかよたれそつねならむ\n" +
        "  うゐのおくやまけふこえて\n" +
        "  あさきゆめみしゑひもせす' FROM dual", false, false, [
            ["いろはにほへとちりぬるを\n" +
            "  わかよたれそつねならむ\n" +
            "  うゐのおくやまけふこえて\n" +
            "  あさきゆめみしゑひもせす"]
    ]);
    runTest(db, "SELECT 'イロハニホヘト チリヌルヲ ワカヨタレソ ツネナラム\n" +
        "  ウヰノオクヤマ ケフコエテ アサキユメミシ ヱヒモセスン' FROM dual", false, false, [
            ["イロハニホヘト チリヌルヲ ワカヨタレソ ツネナラム\n" +
            "  ウヰノオクヤマ ケフコエテ アサキユメミシ ヱヒモセスン"]
    ]);
    runTest(db, "SELECT '結聞ナミオタ入選えフ企正一る件感メフネ志詳ぽほこ高辞クおり会5提ぶま初聞スばゆぼ英脳63千ほラよ携特なお改属ルるぼ決外で題択ルム多1享ば。日情江へごず遺響ぜもべあ検健レ金正こし表善へゃイく指変気ぐ問畳成ちスが象秋氏ラチム内怪ーぞに錯境モタヒノ社掲テヲエツ士面家ホタコヘ暮雄類若べみ。' FROM dual", false, false, [
        ["結聞ナミオタ入選えフ企正一る件感メフネ志詳ぽほこ高辞クおり会5提ぶま初聞スばゆぼ英脳63千ほラよ携特なお改属ルるぼ決外で題択ルム多1享ば。日情江へごず遺響ぜもべあ検健レ金正こし表善へゃイく指変気ぐ問畳成ちスが象秋氏ラチム内怪ーぞに錯境モタヒノ社掲テヲエツ士面家ホタコヘ暮雄類若べみ。"]
    ]);
    runTest(db, "SELECT 'Pchnąć w tę łódź jeża lub ośm skrzyń fig' FROM dual", false, false, [
        ["Pchnąć w tę łódź jeża lub ośm skrzyń fig"]
    ]);

    runTest(db, "SELECT 'Pijamalı hasta, yağız şoföre çabucak güvendi.' FROM dual", false, false, [
        ["Pijamalı hasta, yağız şoföre çabucak güvendi."]
    ]);

    runTest(db, "SELECT 'आपके आवश्यक संस्क्रुति मार्गदर्शन बनाना शारिरिक विस्तरणक्षमता गएआप हिंदी आशाआपस निर्माता यन्त्रालय ढांचा किके सारांश वेबजाल पडता सदस्य स्थापित मार्गदर्शन समाजो वहहर करेसाथ है।अभी स्थापित सादगि एछित लिये बलवान आवश्यकत प्राधिकरन पुष्टिकर्ता जिम्मे सुचनाचलचित्र दिये भाषाओ सादगि ज्यादा कार्यलय एवम् गटको सक्षम वर्णित कार्यसिधान्तो अन्तरराष्ट्रीयकरन सुचना रिती दिशामे सुविधा' FROM dual", false, false,
        [["आपके आवश्यक संस्क्रुति मार्गदर्शन बनाना शारिरिक विस्तरणक्षमता गएआप हिंदी आशाआपस निर्माता यन्त्रालय ढांचा किके सारांश वेबजाल पडता सदस्य स्थापित मार्गदर्शन समाजो वहहर करेसाथ है।अभी स्थापित सादगि एछित लिये बलवान आवश्यकत प्राधिकरन पुष्टिकर्ता जिम्मे सुचनाचलचित्र दिये भाषाओ सादगि ज्यादा कार्यलय एवम् गटको सक्षम वर्णित कार्यसिधान्तो अन्तरराष्ट्रीयकरन सुचना रिती दिशामे सुविधा"]]);

    runTest(db, "SELECT 'ლორემ იფსუმ დოლორ სით ამეთ, ნამ უთ გრაეცი ომითთამ ცონსეყუათ, ეუ ერათ თანთას ლაბორე ნამ, იდ ჰის ფალლი ფეუგაით. თე ეურიფიდის ეფფიციენდი ლიბერავისსე ესთ, სით სონეთ ყუაეყუე ინ, ველით რეფუდიარე თორყუათოს ჰის უთ. ელეიფენდ მედიოცრემ ყუი ან. ეა ველ ნათუმ ფუთენთ, ჰის ეთ აუთემ მელიუს ფერფეთუა. რეყუე რეფრეჰენდუნთ სეა ეი.' FROM dual", false, false, [
        ["ლორემ იფსუმ დოლორ სით ამეთ, ნამ უთ გრაეცი ომითთამ ცონსეყუათ, ეუ ერათ თანთას ლაბორე ნამ, იდ ჰის ფალლი ფეუგაით. თე ეურიფიდის ეფფიციენდი ლიბერავისსე ესთ, სით სონეთ ყუაეყუე ინ, ველით რეფუდიარე თორყუათოს ჰის უთ. ელეიფენდ მედიოცრემ ყუი ან. ეა ველ ნათუმ ფუთენთ, ჰის ეთ აუთემ მელიუს ფერფეთუა. რეყუე რეფრეჰენდუნთ სეა ეი."]
    ]);
    runTest(db, "SELECT '熊本円周邸報協心見属村段豚井。著新棚禁情投能期写最支擦次記専卒確表経。域投家花戻無三仁速歌着母。安末掲治空際中画奥負仏公鬼予選並今内公染。執豊宅変驚諮転金生出積禁温供会夢。成番舞出名決小績引穴動道始木秋読神療。決月身花属芸平供土旅増亡。紙崎属疑査率設境書島意所盗分初際。変棋書審文育選鳥調社杉質引。' FROM dual", false, false, [
        ["熊本円周邸報協心見属村段豚井。著新棚禁情投能期写最支擦次記専卒確表経。域投家花戻無三仁速歌着母。安末掲治空際中画奥負仏公鬼予選並今内公染。執豊宅変驚諮転金生出積禁温供会夢。成番舞出名決小績引穴動道始木秋読神療。決月身花属芸平供土旅増亡。紙崎属疑査率設境書島意所盗分初際。変棋書審文育選鳥調社杉質引。"]
    ]);

    let arabic = "هناك وأزيز كان عن. عرض الهادي التخطيط إذ, ان المارق الأرواح الانجليزية أسر. ان الصينية المعاهدات جعل. ذلك وشعار وأزيز واتّجه في, جُل أي سياسة مدينة الأراضي. أما أم خطّة جديدة للصين, ان ودول تنفّس إعمار ضرب.";
    let sqlArabic = new SQLStatement(db, "SELECT @arabic as result FROM dual");
    sqlArabic.setParameter("@arabic", arabic);
    let retArabic = sqlArabic.run() as SQLResult;
    let resultArabic = readTableAsJSON(db, retArabic.resultTableName);
    assert(resultArabic[0]["result"] === arabic, "Error RTL string.");
    sqlArabic.close();

    checkNoTempTables(db);
    next();
}