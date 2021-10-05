
import { Injectable } from '@angular/core';

@Injectable()
export class ImxBaseAudienceDataStorage {
  private basedAudiences = {
    202106: [
      {
        "audienceKey": 2032,
        "name": "Persons 0+ yrs",
        "description": "Persons 0+ yrs",
        "category_name": "PopFacts",
        "subcategory_name": "Population",
        "displayname": "(PopFacts) Persons 0+ yrs"
      },
      {
        "audienceKey": 2035,
        "name": "Persons 18+ yrs",
        "description": "Persons 18+ yrs (Excludes group quarters population)",
        "category_name": "Population",
        "subcategory_name": "Combined Demographics",
        "displayname": "(Population) Persons 18+ yrs"
      },
      {
        "audienceKey": 2036,
        "name": "Persons 21+ yrs",
        "description": "Persons 21+ yrs",
        "category_name": "Population",
        "subcategory_name": "Combined Demographics",
        "displayname": "(Population) Persons 21+ yrs"
      },
      {
        "audienceKey": 2038,
        "name": "Persons 5+ yrs",
        "description": "Persons 5+ yrs",
        "category_name": "Population",
        "subcategory_name": "Combined Demographics",
        "displayname": "(Population) Persons 5+ yrs"
      },
      {
        "audienceKey": 7166,
        "name": "Persons 18+ yrs",
        "description": "Persons 18+ yrs",
        "category_name": "PopFacts",
        "subcategory_name": "Population",
        "displayname": "(PopFacts) Persons 18+ yrs"
      },
      {
        "audienceKey": 8228,
        "name": "Persons 21+ yrs",
        "description": "Persons 21+ yrs",
        "category_name": "PopFacts",
        "subcategory_name": "Population",
        "displayname": "(PopFacts) Persons 21+ yrs"
      },
      {
        "audienceKey": 8923,
        "name": "Persons 5+ yrs",
        "description": "Persons 5+ yrs",
        "category_name": "PopFacts",
        "subcategory_name": "Population",
        "displayname": "(PopFacts) Persons 5+ yrs"
      },
      {
        "audienceKey": 9330,
        "name": "Persons 0+ yrs",
        "description": "Persons 0+ yrs (Excludes group quarters population)",
        "category_name": "Population",
        "subcategory_name": "Combined Demographics",
        "displayname": "(Population) Persons 0+ yrs"
      }
    ],
    2020: [
      {
        "audienceKey": 2032,
        "name": "Persons 0+ yrs",
        "description": "Persons 0+ yrs",
        "category_name": "PopFacts",
        "subcategory_name": "Combined Demographics",
        "displayname": "(PopFacts) Persons 0+ yrs"
      },
      {
        "audienceKey": 7166,
        "name": "Persons 18+ yrs",
        "description": "Persons 18+ yrs",
        "category_name": "PopFacts",
        "subcategory_name": "Combined Demographics",
        "displayname": "(PopFacts) Persons 18+ yrs"
      },
      {
        "audienceKey": 8228,
        "name": "Persons 21+ yrs",
        "description": "Persons 21+ yrs",
        "category_name": "PopFacts",
        "subcategory_name": "Combined Demographics",
        "displayname": "(PopFacts) Persons 21+ yrs"
      },
      {
        "audienceKey": 8923,
        "name": "Persons 5+ yrs",
        "description": "Persons 5+ yrs",
        "category_name": "PopFacts",
        "subcategory_name": "Combined Demographics",
        "displayname": "(PopFacts) Persons 5+ yrs"
      }
    ],
    2021: [
      {
        "audienceKey": 2032,
        "name": "Persons 0+ yrs",
        "description": "Persons 0+ yrs",
        "category_name": "PopFacts",
        "subcategory_name": "Population",
        "displayname": "(PopFacts) Persons 0+ yrs"
      },
      {
        "audienceKey": 2035,
        "name": "Persons 18+ yrs",
        "description": "Persons 18+ yrs",
        "category_name": "Population",
        "subcategory_name": "Combined Demographics",
        "displayname": "(Population) Persons 18+ yrs"
      },
      {
        "audienceKey": 2036,
        "name": "Persons 21+ yrs",
        "description": "Persons 21+ yrs",
        "category_name": "Population",
        "subcategory_name": "Combined Demographics",
        "displayname": "(Population) Persons 21+ yrs"
      },
      {
        "audienceKey": 2038,
        "name": "Persons 5+ yrs",
        "description": "Persons 5+ yrs",
        "category_name": "Population",
        "subcategory_name": "Combined Demographics",
        "displayname": "(Population) Persons 5+ yrs"
      },
      {
        "audienceKey": 7166,
        "name": "Persons 18+ yrs",
        "description": "Persons 18+ yrs",
        "category_name": "PopFacts",
        "subcategory_name": "Population",
        "displayname": "(PopFacts) Persons 18+ yrs"
      },
      {
        "audienceKey": 8228,
        "name": "Persons 21+ yrs",
        "description": "Persons 21+ yrs",
        "category_name": "PopFacts",
        "subcategory_name": "Population",
        "displayname": "(PopFacts) Persons 21+ yrs"
      },
      {
        "audienceKey": 8923,
        "name": "Persons 5+ yrs",
        "description": "Persons 5+ yrs",
        "category_name": "PopFacts",
        "subcategory_name": "Population",
        "displayname": "(PopFacts) Persons 5+ yrs"
      }
    ]
  };

  getAllItems() {
    return this.basedAudiences;
  }
  get(key) {
    if (this.basedAudiences) {
        var item = this.basedAudiences[key];
        return item;
    } else {
        return null;
    }
  }
}
