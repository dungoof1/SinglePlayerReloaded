import { DependencyContainer } from "tsyringe";

// SPT types
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import { IInsuranceConfig } from "@spt/models/spt/config/IInsuranceConfig";
import { ConfigServer } from "@spt/servers/ConfigServer";
import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
import { ItemHelper } from "@spt/helpers/ItemHelper";

// Json
import { VFS } from "@spt/utils/VFS";
import { jsonc } from "jsonc";
import path from "node:path";
import { BaseClasses } from "@spt/models/enums/BaseClasses";


class Mod implements IPostDBLoadMod
{
    public postDBLoad(container: DependencyContainer): void
    {

        const vfs = container.resolve<VFS>("VFS");
        const itemHelper = container.resolve<ItemHelper>("ItemHelper");
        const config = jsonc.parse(vfs.readFile(path.resolve(__dirname, "../config/config.jsonc")));

        // Set config to local
        const stashChanges = config.hideout.stashChanges;
        const instantConstruction = config.hideout.instantConstruction;

        const bitcoinBuff = config.hideout.bitcoinBuff;

        const disableFlea = config.traders.disableFlea;
        const insuranceChanges = config.traders.insuranceChanges;

        const secureAssortChanges = config.traders.secureAssortChanges;

        const keyChanges = config.keyChanges;

        // Get database and json
        const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const database: IDatabaseTables = databaseServer.getTables();

        const configServer= container.resolve<ConfigServer>("ConfigServer");
        const insuranceConfig = configServer.getConfig<IInsuranceConfig>(ConfigTypes.INSURANCE);

        // Get SPT data
        const peacekeeper = database.traders["5935c25fb3acc3127c3d8cd9"];
        const prapor = database.traders["54cb50c76803fa8b248b4571"];
        const therapist = database.traders["54cb57776803fa99248b456e"];
        
        // Hideout

        // Stash upgrade changes, thanks softcore
        if (stashChanges) 
        {
            const stash = database.hideout.areas.find((x) => x._id == "5d484fc0654e76006657e0ab");
            for (const stage in stash.stages) 
            {
                stash.stages[stage].requirements
                    .filter((x) => x.loyaltyLevel != undefined)
                    .forEach((x) => 
                    {
                        x.loyaltyLevel -= 1
                    });
        
                stash.stages[stage].requirements
                    .filter((x) => x.templateId == "5449016a4bdc2d6f028b456f" || x.templateId == "569668774bdc2da2298b4568")
                    .forEach((x) => 
                    {
                        x.count /= 10
                    });
            }
        }

        // Construction
        if (instantConstruction)
        {
            for (const area in database.hideout.areas) 
            {
                for (const stage in database.hideout.areas[area].stages) 
                {
                    database.hideout.areas[area].stages[stage].constructionTime = 0;
                }
            }
        }
    
        // Bitcoin farm
        if (bitcoinBuff)
        {
            database.hideout.settings.gpuBoostRate = 0.1;
            const bitcoinProd = database.hideout.production.recipes.find((x) => x.endProduct == "59faff1d86f7746c51718c9c");
            bitcoinProd.productionTime = bitcoinProd.productionTime * 0.9;
        }

        // Traders

        // Disable flea
        if (disableFlea)
        {
            database.globals.config.RagFair.minUserLevel = 99;
        }

        // Insurance
        if (insuranceChanges)
        {
            // Prapor
            prapor.base.insurance.min_return_hour = 2;
            prapor.base.insurance.max_return_hour = 3;
            prapor.base.insurance.max_storage_time = 1000;
            insuranceConfig.returnChancePercent["54cb50c76803fa8b248b4571"] = 30;
            
            // Therapist
            therapist.base.insurance.min_return_hour = 4;
            therapist.base.insurance.max_return_hour = 5;
            therapist.base.insurance.max_storage_time = 1000;
            insuranceConfig.returnChancePercent["54cb57776803fa99248b456e"] = 60;
            
            for (const ll in therapist.base.loyaltyLevels) 
            {
                therapist.base.loyaltyLevels[ll].insurance_price_coef *= 2;
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
            const alphaBarter = peacekeeper.assort.items.find((x) => x._tpl == "544a11ac4bdc2d470e8b456a")._id;
            const betaBarter = peacekeeper.assort.items.find((x) => x._tpl == "5857a8b324597729ab0a0e7d")._id;
            const gammaBarter = peacekeeper.assort.items.find((x) => x._tpl == "5857a8bc2459772bad15db29")._id;

            peacekeeper.assort.barter_scheme[alphaBarter] = 
            [
                [
                    {
                        count: 2000,
                        _tpl: "5696686a4bdc2da3298b456a"
                    }
                ]
            ];

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
            ];

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
            ];

            peacekeeper.assort.loyal_level_items[alphaBarter] = 1;
            peacekeeper.assort.loyal_level_items[betaBarter] = 2;
            peacekeeper.assort.loyal_level_items[gammaBarter] = 4;
        }

        // Infinite Key uses, weightless
        if (keyChanges)
        {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const [_, item] of Object.entries(database.templates.items))
            {
                if (itemHelper.isOfBaseclass(item._id, BaseClasses.KEY))
                {
                    item._props.Weight = 0.0;
                    item._props.MaximumNumberOfUsage = 0;
                    item._props.DiscardLimit = -1;
                }
            }
        }
    }
}

export const mod = new Mod();
