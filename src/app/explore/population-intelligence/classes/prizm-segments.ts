// static prizm segment helpers

import { MenuOption } from '@interTypes/population-intelligence-types';

export class PrizmSegments {
  static allSegments: MenuOption[] = [
    { value: null, text: 'N/A' },
    // https://en.wikipedia.org/wiki/Claritas_Prizm
    { value: 'pz_seg01', text: 'Upper Crust' }, // Members of this segment are made up of couples over the age of 65 whose children have moved out. Many possess a postgraduate degree.
    { value: 'pz_seg02', text: 'Networked Neighbors' }, // They are characterized by married couples with children, living in the suburbs, having high technology usage, and graduate degrees. Their jobs consist of business executives, managers, and professionals.
    { value: 'pz_seg03', text: 'Movers & Shakers' }, // Couples are typically between the ages of 45 and 64 living in the suburbs. They are highly educated and have a high percentage of executives and white-collar professionals.
    { value: 'pz_seg04', text: 'Young Digerati' }, // This segment is choosing to start families in fashionable neighborhoods on the urban fringe. They are highly educated and very tech-savvy.
    { value: 'pz_seg05', text: 'Country Squires' }, // Members of this segment fled the city life for the charms of small-town living. Many have executive jobs and live in recently built homes.
    { value: 'pz_seg06', text: 'Winner\'s Circle' }, // They live in suburban neighbors and are made up of 35- to 54-year-old couples with large families. They enjoy traveling and new experiences.
    { value: 'pz_seg07', text: 'Money & Brains' }, // Many of these city dwellers have advanced degrees and are married couples with few children who live in fashionable homes.
    { value: 'pz_seg08', text: 'Gray Power' }, // This segment consists of upscale older couples typically living just beyond the nation's beltways. Known for white-collar professionals drawn to comfortable homes and apartments within a manageable commute to downtown jobs.
    { value: 'pz_seg09', text: 'Big Fish, Small Pond' }, // Older, emptying-nesting, college-educated, the members of this segment are often among the leading citizens of their small-town communities.
    { value: 'pz_seg10', text: 'Executive Suites' }, // The residents of this segment tend to be prosperous and active professionals. They are also above average in their use of technology.
    { value: 'pz_seg11', text: 'Fast-Track Families' }, // This segment leads busy, active lives often centered around the schedules and interests of their children. Always on the go, they frequent restaurant diners and shop at wholesale clubs.
    { value: 'pz_seg12', text: 'Cruisin\' to Retirement' }, // With their children mostly grown and out of the house, these older couples are Cruisin' to Retirement. They remain in the neighborhoods they raised their families in and enjoy their suburban lifestyle.
    { value: 'pz_seg13', text: 'Upward Bound' }, // This segment is made up of families, with college degrees, and new homes. They are above average technology users who own multiple computers.
    { value: 'pz_seg14', text: 'Kids & Cul-de-Sacs' }, // These married couples with children live in recently built subdivision in suburban neighborhoods. This segment is a refuge for college-educated, white-collar professionals with administrative jobs.
    { value: 'pz_seg15', text: 'New Homesteaders' }, // Young families seeking to escape the suburban sprawl finding refuge in a collection of small rustic townships. They have child-centered lifestyles and a mix of jobs in white and blue-collar industries.
    { value: 'pz_seg16', text: 'Beltway Boomers' }, // Like many of their peers who married late, many are college-educated and raising children in comfortable suburban subdivisions while beginning to plan for their own retirement.
    { value: 'pz_seg17', text: 'Urban Elders' }, // A segment located in downtown neighborhoods and are more likely to be renters than other households in their age cohort. They enjoy the cultural options available to them in their communities.
    { value: 'pz_seg18', text: 'Mayberry-ville' }, // Living in small towns this segment enjoys outdoor activities. They live an old-fashioned way of life and are below average in their use of technology.
    { value: 'pz_seg19', text: 'American Dreams' }, // This segment lives in urban areas. They are heavy grocery and convenience store shoppers, opting to prepare meals at home more than their urban counterparts in other segments.
    { value: 'pz_seg20', text: 'Empty Nests' }, // Most residents are over 65 years old, but they show no interest in a rest-home retirement. With their grown-up children out of the house they pursue active, and activist, lifestyles.
    { value: 'pz_seg21', text: 'The Cosmopolitans' }, // Concentrated in major metro areas, these households feature older homeowners. They tend to be educated, married, and enjoy a leisure-intensive lifestyle.
    { value: 'pz_seg22', text: 'Middleburg Managers' }, // This segment has solid white-collar jobs and good educations. In their older homes, they enjoy reading, while time spending time outside.
    { value: 'pz_seg23', text: 'Township Travelers' }, // Homeowners exhibit a blend of behaviors representative of their small-town environment. They enjoy outdoor activities like fishing and off-road biking but also enjoy the creature comforts of reading.
    { value: 'pz_seg24', text: 'Pickup Patriarchs' }, // They live in areas that are somewhat rural but have more of a suburban taste. They are frequent golfers, boaters, and heavy shoppers.
    { value: 'pz_seg25', text: 'Up-and-Comers' }, // Found in suburban areas and second cities, these mobile adults, mostly age 25 to 44, are college graduates who are into athletic activities and the latest technology. Many are continuing their education in the hopes of owning a home and achieving greater success in later years.
    { value: 'pz_seg26', text: 'Home Sweet Home' }, // Widely scattered across the nation's suburbs and second cities, these residents tend to be younger, and families live in mid-sized homes. They are mostly under 55, have gone to college, and hold professional and white-collar jobs.
    { value: 'pz_seg27', text: 'Big Sky Families' }, // Scattered in placid towns across the American heartland, they are middle-aged rural families who have high school educations and blue-collar jobs. To entertain their families, they do outdoor activities and buy sporting equipment.
    { value: 'pz_seg28', text: 'Country Casuals' }, // This segment is a collection of older empty-nesting households. These couples enjoy outdoor activities, hunting, and going out to eat but are not likely to be up-to-date on technology.
    { value: 'pz_seg29', text: 'White Picket Fences' }, // Residents are married with children- some parents just began starting a family while others approach the empty-nest stage as their children age. They enjoy reading and following sports.
    { value: 'pz_seg30', text: 'Pools & Patios' }, // This segment is made up of middle-aged suburban families. These residents work as white-collar managers and professionals, they are above average technology users.
    { value: 'pz_seg31', text: 'Connected Bohemians' }, // These mix of young singles, couples, and families ranging from students to professionals all have one thing in common, being tech savvy. They are always early adopters of the latest and greatest thing.
    { value: 'pz_seg32', text: 'Traditional Times' }, // Typically age 65 and older, these Americans pursue an active lifestyle. They are small-town couples nearing retirement and are beginning to enjoy their first empty-nest years.
    { value: 'pz_seg33', text: 'Second City Startups' }, // These families have settled in neighborhoods within smaller cities and metro areas. This segment tends to be average in technology usage.
    { value: 'pz_seg34', text: 'Young & Influential' }, // This segment is made up of young singles and couples who are very preoccupied with balancing work and leisure pursuits. Many are influential in their communities, social networks, and are extremely tech savvy.
    { value: 'pz_seg35', text: 'Urban Achievers' }, // Residents live in urban neighborhoods with established careers and college degrees. They are active participants in their communities and strong supporters of their local professional sports teams.
    { value: 'pz_seg36', text: 'Toolbelt Traditionalists' }, // This segment is mostly made up of empty nesters who are older in age. If something needs to be fixed, they are likely to do the work themselves.
    { value: 'pz_seg37', text: 'Bright Lights, Li\'l City' }, // They are college educated, younger couples who settled in the nation's satellite cities and suburbs. Despite living further out from the urban downtowns, they still like to go out on the town for frequent meals out.
    { value: 'pz_seg38', text: 'Hometown Retired' }, // Consisted of older, midscale couples with no kids at home. Somewhat set in their ways, they are slow to adopt and below average in their use of technology.
    { value: 'pz_seg39', text: 'Kid Country, USA' }, // Widely scattered throughout the nation's heartland this segment is dominated by hard working families living in small towns.
    { value: 'pz_seg40', text: 'Aspiring A-Listers' }, // Typically, urban renters, they are focused on their social lives and dine out often. In addition, they have above average technology usage.
    { value: 'pz_seg41', text: 'Domestic Duos' }, // Made up of over-65 singles and married couples living in older suburban and second city homes. They tend to maintain an easy-going, predictable lifestyle often socializing with friends.
    { value: 'pz_seg42', text: 'Multi-Culti Mosaic' }, // This segment is the made up of singles and families living in urban neighborhoods.
    { value: 'pz_seg43', text: 'City Roots' }, // Found in urban neighborhoods this segment typically living in old homes they've owned for years. These residents are hard-working and enjoy traveling.
    { value: 'pz_seg44', text: 'Country Strong' }, // These families live in rural areas that embrace their day-to-day lives. They are focused on their families and prefer hunting and country music to keeping up with the latest technology.
    { value: 'pz_seg45', text: 'Urban Modern Mix' }, // These singles live near the city center and are considered average in technology usage. They also enjoy frequently online shopping.
    { value: 'pz_seg46', text: 'Heartlanders' }, // This widespread segment consists of mostly retired older couples living in communities of small families. These empty-nesting couples pursue a rustic lifestyle and have many leisure activities.
    { value: 'pz_seg47', text: 'Striving Selfies' }, // These younger singles and couples typically rent apartments and homes. They are among the most tech savvy segments with some college credits under their belt.
    { value: 'pz_seg48', text: 'Generation Web' }, // Having grown up in the age of the internet, these younger families are above average in technology usage. They are more often renters, living in suburban neighborhoods and second cities.
    { value: 'pz_seg49', text: 'American Classics' }, // These older and retired homeowners live a comfortable lifestyle. Couples tend to be below average in their technology use, preferring to find their entertainment outside of the home.
    { value: 'pz_seg50', text: 'Metro Grads' }, // Middle-aged singles and couples still establishing themselves in their careers and their lives. They are settled in suburban areas and second cities but are often out and about.
    { value: 'pz_seg51', text: 'Campers & Camo' }, // Primarily found in rural areas these families enjoy the outdoors. Despite their age, they are below average in their use of technology.
    { value: 'pz_seg52', text: 'Simple Pleasures' }, // Many of its residents are over the age of 65 years old and mostly retired. Many are high school-educated seniors who held blue-collar jobs before their retirement.
    { value: 'pz_seg53', text: 'Lo-Tech Singles' }, // Older households centered mainly in the nation's second cities. Residents are below average in their technology use, choosing instead a night out at a restaurant as their evening entertainment.
    { value: 'pz_seg54', text: 'Struggling Singles' }, // Households found mostly in second cities, this segment is in mid-career with their jobs. They enjoy a wide variety of sports and entertainment activities that fill their social calendars.
    { value: 'pz_seg55', text: 'Red, White & Blue' }, // Middle-aged, with high school educations, many of these folks are transitioning from blue-collar jobs to the service industry. In their spare time, they are active members of their local community organizations.
    { value: 'pz_seg56', text: 'Multi-Culti Families' }, // Middle-aged, urban households with moderate means. They enjoy a wide variety of media and are average in their overall use of technology.
    { value: 'pz_seg57', text: 'Back Country Folks' }, // Strewn among remote farm communities across the nation, these residents live in older, modest-sized homes. Typically, life in this segment is a throwback to an earlier era when farming dominated the American landscape.
    { value: 'pz_seg58', text: 'Golden Ponds' }, // This segment is mostly a retirement lifestyle, dominated by singles and couples over 50 years old. Found in small bucolic towns around the country, these high school-educated seniors live in small apartments.
    { value: 'pz_seg59', text: 'New Melting Pot' }, // Residents are populated by a blend of families and singles in the nation's second cities. They are mainly high school graduates that rent and work in a mix of service jobs.
    { value: 'pz_seg60', text: 'Small-Town Collegiates' }, // Mainly younger families and singles who are just starting out. They are often students- full or part-time- focused on building a better life for themselves and their growing families.
    { value: 'pz_seg61', text: 'Second City Generations' }, // Often multi-generational households with middle-aged parents or grandparents and new babies and young children all under one roof. They are entertained by a wide variety of media channels and programs.
    { value: 'pz_seg62', text: 'Crossroad Villagers' }, // With a population of retired seniors, residents are high-school educated, with modest housing, and live small-town lifestyles. They also enjoy the occasional dinner out.
    { value: 'pz_seg63', text: 'Low-Rise Living' }, // Mostly middle-aged, singles and single parents. They rank above average in their use of technology- perhaps influenced by their urban, fast-paced environment.
    { value: 'pz_seg64', text: 'Family Thrifts' }, // This segment contains families, that work entry-level service jobs. In these inner-city apartment-filled neighborhoods, residents rely on public transportation.
    { value: 'pz_seg65', text: 'Young & Rustic' }, // Composed of restless singles and young families in the nation's rural areas. They enjoy the outdoors and are big video gamers.
    { value: 'pz_seg66', text: 'New Beginnings' }, // Filled with younger, mostly single adults and couples just starting out on their career paths in service jobs. They are a magnet for adults in transition some are getting over a recent divorce or transferring to a new company.
    { value: 'pz_seg67', text: 'Park Bench Seniors' }, // Park Bench Seniors are typically retired singles living in the neighborhoods of the nation's satellite cities. With modest educations, these residents maintain low-key, sedentary lifestyles.
    { value: 'pz_seg68', text: 'Bedrock America' } // This segment is made up of families in small, isolated towns located throughout the nation's heartland. They have modest educations, sprawling families, and service jobs
  ]

  static displaySegment(name: string): string {
    let option = this.allSegments.find(o => o.value === name)
    return option ? option.text : 'N/A'
  }
}
