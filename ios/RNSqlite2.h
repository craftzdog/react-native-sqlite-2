#import <React/RCTBridgeModule.h>
#import <Foundation/Foundation.h>

#ifdef DEBUG_RNSqlite2
#define logDebug(fmt, ...) NSLog((@"%s [Line %d] " fmt), __PRETTY_FUNCTION__, __LINE__, ##__VA_ARGS__);
#else
#define logDebug(...)
#endif

@interface RNSqlite2 : NSObject <RCTBridgeModule>

@property (nonatomic, copy) NSMutableDictionary *cachedDatabases;
@property (nonatomic, copy) NSMutableDictionary *dbQueues;

@end
