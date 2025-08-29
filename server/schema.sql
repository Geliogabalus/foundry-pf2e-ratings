CREATE TABLE "Entry" (
	"id"	INTEGER,
	"rating"	REAL,
	"typeId"	INTEGER NOT NULL,
	PRIMARY KEY("id"),
	FOREIGN KEY("typeId") REFERENCES "EntryType"("id")
)

CREATE TABLE "EntryType" (
	"id"	INTEGER,
	"name"	TEXT,
	PRIMARY KEY("id")
)

CREATE TABLE "Rating" (
	"id"	INTEGER,
	"entryId"	INTEGER NOT NULL UNIQUE,
	"1"	INTEGER NOT NULL DEFAULT 0,
	"2"	INTEGER NOT NULL DEFAULT 0,
	"3"	INTEGER NOT NULL DEFAULT 0,
	"4"	INTEGER NOT NULL DEFAULT 0,
	"5"	INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("entryId") REFERENCES "Entry"("id")
)

CREATE TABLE "User" (
	"id"	INTEGER,
	PRIMARY KEY("id" AUTOINCREMENT)
)

CREATE TABLE "UserRating" (
	"userId"	INTEGER,
	"entryId"	TEXT,
	"rating"	INTEGER,
	PRIMARY KEY("userId","entryId"),
	FOREIGN KEY("entryId") REFERENCES "Entry"("id"),
	FOREIGN KEY("userId") REFERENCES "User"("id")
)

CREATE TRIGGER IF NOT EXISTS user_rating_update AFTER UPDATE ON UserRating
BEGIN
    -- Increment the new rating
    UPDATE Rating
    SET
        "1" = "1" + CASE WHEN new.rating = 1 THEN 1 ELSE 0 END,
        "2" = "2" + CASE WHEN new.rating = 2 THEN 1 ELSE 0 END,
        "3" = "3" + CASE WHEN new.rating = 3 THEN 1 ELSE 0 END,
        "4" = "4" + CASE WHEN new.rating = 4 THEN 1 ELSE 0 END,
        "5" = "5" + CASE WHEN new.rating = 5 THEN 1 ELSE 0 END
    WHERE new.entryId = entryId;

    -- Decrement the old rating
    UPDATE Rating
    SET
        "1" = "1" - CASE WHEN old.rating = 1 THEN 1 ELSE 0 END,
        "2" = "2" - CASE WHEN old.rating = 2 THEN 1 ELSE 0 END,
        "3" = "3" - CASE WHEN old.rating = 3 THEN 1 ELSE 0 END,
        "4" = "4" - CASE WHEN old.rating = 4 THEN 1 ELSE 0 END,
        "5" = "5" - CASE WHEN old.rating = 5 THEN 1 ELSE 0 END
    WHERE new.entryId = entryId;
END;

CREATE TRIGGER IF NOT EXISTS user_rating_insert AFTER INSERT ON UserRating
BEGIN
    -- Increment the new rating
    UPDATE Rating
    SET
        "1" = "1" + CASE WHEN new.rating = 1 THEN 1 ELSE 0 END,
        "2" = "2" + CASE WHEN new.rating = 2 THEN 1 ELSE 0 END,
        "3" = "3" + CASE WHEN new.rating = 3 THEN 1 ELSE 0 END,
        "4" = "4" + CASE WHEN new.rating = 4 THEN 1 ELSE 0 END,
        "5" = "5" + CASE WHEN new.rating = 5 THEN 1 ELSE 0 END
    WHERE new.entryId = entryId;
END;

CREATE TRIGGER IF NOT EXISTS rating_update AFTER UPDATE ON Rating
BEGIN
    -- Increment the new rating
    UPDATE Entry
    SET rating = (new."1" + new."2" * 2 + new."3" * 3 + new."4" * 4 + new."5" * 5) / (new."1" + new."2" + new."3" + new."4" + new."5")
    WHERE new.entryId = id;
END;
