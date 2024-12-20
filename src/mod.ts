import { DependencyContainer } from "tsyringe";

// SPT types
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";

// Json
import { VFS } from "@spt/utils/VFS";
import { jsonc } from "jsonc";
import path from "node:path";

class Mod implements IPostDBLoadMod
{
    public postDBLoad(container: DependencyContainer): void
    {

        const vfs = container.resolve<VFS>("VFS");
        const config = jsonc.parse(vfs.readFile(path.resolve(__dirname, "../config/config.jsonc")));

        // Set config to local
        const stashChanges = config.hideout.stashChanges;
        const hideoutQOL = config.hideout.hideoutQOL;

        const disableFlea = config.traders.disableFlea;
        const insuranceChanges = config.traders.insuranceChanges;
        const secureAssortChanges = config.traders.secureAssortChanges;

        // Get database and json
        const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const database: IDatabaseTables = databaseServer.getTables();

        // Get SPT data
        const stash = database.hideout.areas.find((x) => x._id == "5d484fc0654e76006657e0ab");
        const peacekeeper = database.traders["5935c25fb3acc3127c3d8cd9"];
        const prapor = database.traders["54cb50c76803fa8b248b4571"];
        const therapist = database.traders["54cb57776803fa99248b456e"];
        
        // Stash upgrade changes, thanks softcore
        if (stashChanges) 
        {
            for (const stage in stash.stages) 
            {
                stash.stages[stage].requirements
                    .filter((x) => x.loyaltyLevel != undefined)
                    .forEach((x) => 
                    {
                        x.loyaltyLevel -= 1
                    })
        
                stash.stages[stage].requirements
                    .filter((x) => x.templateId == "5449016a4bdc2d6f028b456f" || x.templateId == "569668774bdc2da2298b4568")
                    .forEach((x) => 
                    {
                        x.count /= 10
                    })
            }
        }
        
        // Change barters and pricings for assort
        if (secureAssortChanges)
        {
            // Add gamma
            peacekeeper.assort.items.push({
                "_id": "676461e0077d25ad74075130",
                "_tpl": "5857a8bc2459772bad15db29",
                "parentId": "hideout",
                "slotId": "hideout",
                "upd": {
                    UnlimitedCount: true,
                    StackObjectsCount: 9999999,
                    BuyRestrictionMax: 1,
                    BuyRestrictionCurrent: 0
                }
            })

            // Edit barters
            const alphaBarter = peacekeeper.assort.items.find((x) => x._tpl == "544a11ac4bdc2d470e8b456a")._id
            const betaBarter = peacekeeper.assort.items.find((x) => x._tpl == "5857a8b324597729ab0a0e7d")._id
            const gammaBarter = peacekeeper.assort.items.find((x) => x._tpl == "5857a8bc2459772bad15db29")._id

            peacekeeper.assort.barter_scheme[alphaBarter] = 
            [
                [
                    {
                        count: 2000,
                        _tpl: "5696686a4bdc2da3298b456a"
                    }
                ]
            ]

            peacekeeper.assort.barter_scheme[betaBarter] = 
            [
                [
                    {
                        count: 1,
                        _tpl: "59faff1d86f7746c51718c9c"
                    },
                    {
                        count: 2,
                        _tpl: "57347ca924597744596b4e71"
                    }
                ]
            ]

            peacekeeper.assort.barter_scheme[gammaBarter] = 
            [
                [
                    {
                        count: 1,
                        _tpl: "655c663a6689c676ce57af85"
                    },
                    {
                        count: 1,
                        _tpl: "5b3b713c5acfc4330140bd8d"
                    },
                    {
                        count: 1,
                        _tpl: "62963c18dbc8ab5f0d382d0b"
                    }
                ]
            ]

            peacekeeper.assort.loyal_level_items[alphaBarter] = 1;
            peacekeeper.assort.loyal_level_items[betaBarter] = 2;
            peacekeeper.assort.loyal_level_items[gammaBarter] = 4;
        }
        
        // Disable flea
        if (disableFlea)
        {
            database.globals.config.RagFair.minUserLevel = 99
        }

        // Disable insurance
        if (insuranceChanges)
        {
            return
        }
        // Hideout changes
        if (hideoutQOL) 
        {
            return
        }
    }
}

export const mod = new Mod();
