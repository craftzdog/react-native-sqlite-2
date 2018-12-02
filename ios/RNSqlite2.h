
#if __has_include("RCTBridgeModule.h")
#import "RCTBridgeModule.h"
#else
#import <React/RCTBridgeModule.h>
#endif

#import <Foundation/Foundation.h>

#define logDebug

@interface RNSqlite2 : NSObject <RCTBridgeModule>

@property (nonatomic, copy) NSMutableDictionary *cachedDatabases;
@property (nonatomic, copy) NSMutableDictionary *dbQueues;

@end
  
